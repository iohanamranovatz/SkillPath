"use server";

import { revalidatePath } from "next/cache";
import { askJSON } from "@/backend/ai/client";
import { createClient } from "@/helper/supabase/server";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type QuestionDraft = {
    text: string;
    options: string[];
    correctIndex: number;
    // Set when an existing question covers the same ground. The admin decides;
    // nothing is dropped silently.
    duplicateOf: string | null;
    similarity: number;
};

type GeneratedQuestion = {
    text: string;
    options: string[];
    correctIndex: number;
};

const MAX_COUNT = 10;

// Above this word overlap two questions are treated as the same question asked
// twice. Tuned to catch rewordings ("What is a variable?" vs "What is a
// variable in programming?") without flagging two genuinely different questions
// that happen to share vocabulary.
const DUPLICATE_THRESHOLD = 0.6;

const SYSTEM_PROMPT = `You write multiple-choice questions for a technical skill-assessment app.

Rules:
- Exactly 4 options per question, all plausible. Exactly ONE is correct.
- "correctIndex" is the 0-based index of the correct option.
- Do not repeat any question from the "avoid" list, and do not repeat yourself.
  Rewording an existing question counts as repeating it - ask about something else.
- No "all of the above" / "none of the above". No trick questions.
- Match the requested difficulty: EASY = recall of a core fact, MEDIUM = applying a
  concept, HARD = reasoning about an edge case or trade-off.
- "text" is the full question. The admin list shows its first characters as the
  label, so put the substance up front rather than a generic opener.

Answer with JSON only, in exactly this shape:
{"questions": [{"text": string, "options": [string, string, string, string], "correctIndex": number}]}`;

// "What is a VARIABLE, exactly?" and "what is a variable exactly" must compare equal.
function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// Words that appear in almost every question and would inflate the overlap score.
const STOP_WORDS = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "of", "in", "on",
    "at", "to", "for", "with", "and", "or", "not", "what", "which", "who", "how",
    "does", "do", "did", "will", "would", "can", "could", "you", "your", "it",
    "its", "this", "that", "these", "those", "following", "used", "use",
]);

function contentWords(normalized: string): Set<string> {
    return new Set(normalized.split(" ").filter((word) => word.length > 1 && !STOP_WORDS.has(word)));
}

// Jaccard index: shared words / total distinct words. 1 = identical wording.
function similarity(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0;

    let shared = 0;
    a.forEach((word) => {
        if (b.has(word)) shared++;
    });

    return shared / (a.size + b.size - shared);
}

type ExistingQuestion = { text: string; normalized: string; words: Set<string> };

async function loadExistingQuestions(categoryId: number): Promise<ExistingQuestion[]> {
    const supabase = await createClient();

    // Every question in the category, not a recent slice - a duplicate of an old
    // question is still a duplicate.
    const { data } = await supabase
        .from("questions")
        .select("question_text")
        .eq("category_id", categoryId);

    return (data ?? []).map((row: any) => {
        const text = String(row.question_text ?? "");
        const normalized = normalize(text);
        return { text, normalized, words: contentWords(normalized) };
    });
}

function findDuplicate(
    text: string,
    existing: ExistingQuestion[]
): { duplicateOf: string | null; similarity: number } {
    const normalized = normalize(text);
    const words = contentWords(normalized);

    let best: { duplicateOf: string | null; similarity: number } = { duplicateOf: null, similarity: 0 };

    for (const candidate of existing) {
        const score = candidate.normalized === normalized ? 1 : similarity(words, candidate.words);
        if (score > best.similarity) {
            best = { duplicateOf: candidate.text, similarity: score };
        }
    }

    return best.similarity >= DUPLICATE_THRESHOLD ? best : { duplicateOf: null, similarity: best.similarity };
}

function isShapeValid(text: string, options: string[], correctIndex: number): boolean {
    return (
        text.length > 0 &&
        options.length === 4 &&
        options.every((option) => option.length > 0) &&
        new Set(options).size === 4 &&
        Number.isInteger(correctIndex) &&
        correctIndex >= 0 &&
        correctIndex < 4
    );
}

async function resolveCategory(name: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("categories")
        .select("id, name, description")
        .eq("name", name)
        .single();

    return error || !data ? null : data;
}

/**
 * Produces candidates for review. Writes nothing - saveQuestionDrafts does that
 * once the admin has decided which ones to keep.
 */
export async function generateQuestionDrafts(input: {
    category: string;
    difficulty: Difficulty;
    count: number;
}): Promise<{ success: boolean; error?: string; drafts?: QuestionDraft[]; discarded?: number }> {
    const count = Math.min(Math.max(Number(input.count) || 5, 1), MAX_COUNT);

    const category = await resolveCategory(input.category);
    if (!category) return { success: false, error: `Category '${input.category}' not found.` };

    const existing = await loadExistingQuestions(category.id);

    const result = await askJSON<{ questions: GeneratedQuestion[] }>(
        SYSTEM_PROMPT,
        JSON.stringify({
            category: category.name,
            categoryDescription: category.description ?? null,
            difficulty: input.difficulty,
            count,
            avoid: existing.map((q) => q.text),
        }),
        // The admin runs this rarely, so a little reasoning is worth the latency.
        { reasoningEffort: "low", timeoutMs: 45000, maxTokens: 8192 }
    );

    if (!result.ok) return { success: false, error: result.error };

    const generated = Array.isArray(result.data?.questions) ? result.data.questions : [];
    if (generated.length === 0) return { success: false, error: "The AI returned no questions." };

    const drafts: QuestionDraft[] = [];
    const seenInBatch: ExistingQuestion[] = [];
    let discarded = 0;

    for (const question of generated.slice(0, count)) {
        const text = String(question?.text ?? "").trim();
        const options = Array.isArray(question?.options)
            ? question.options.map((option) => String(option ?? "").trim())
            : [];
        const correctIndex = Number(question?.correctIndex);

        if (!isShapeValid(text, options, correctIndex)) {
            discarded++;
            continue;
        }

        // Compare against the database AND against the questions generated
        // earlier in this same batch.
        const match = findDuplicate(text, [...existing, ...seenInBatch]);

        const normalized = normalize(text);
        seenInBatch.push({ text, normalized, words: contentWords(normalized) });

        drafts.push({ text, options, correctIndex, ...match });
    }

    if (drafts.length === 0) {
        return { success: false, error: "Every generated question failed validation. Try again." };
    }

    return { success: true, drafts, discarded };
}

/**
 * Inserts the drafts the admin chose to keep. The payload comes from the client,
 * so everything is validated again here.
 */
export async function saveQuestionDrafts(input: {
    category: string;
    difficulty: Difficulty;
    drafts: { text: string; options: string[]; correctIndex: number }[];
}): Promise<{ success: boolean; error?: string; inserted?: number }> {
    const supabase = await createClient();

    if (!Array.isArray(input.drafts) || input.drafts.length === 0) {
        return { success: false, error: "Nothing to save." };
    }
    if (!["EASY", "MEDIUM", "HARD"].includes(input.difficulty)) {
        return { success: false, error: "Invalid difficulty." };
    }

    const category = await resolveCategory(input.category);
    if (!category) return { success: false, error: `Category '${input.category}' not found.` };

    const rows = [];
    for (const draft of input.drafts.slice(0, MAX_COUNT)) {
        const text = String(draft?.text ?? "").trim();
        const options = Array.isArray(draft?.options)
            ? draft.options.map((option) => String(option ?? "").trim())
            : [];
        const correctIndex = Number(draft?.correctIndex);

        if (!isShapeValid(text, options, correctIndex)) {
            return { success: false, error: "A question failed validation and was not saved." };
        }

        // No `title` column on `questions` - the admin table derives the label
        // from question_text, same as manually created questions.
        rows.push({
            question_text: text,
            category_id: category.id,
            difficulty: input.difficulty,
            // Option ids are assigned here rather than taken from the model, so
            // correct_answer always points at an option that exists.
            options: options.map((optionText, index) => ({ id: `opt_${index + 1}`, text: optionText })),
            correct_answer: `opt_${correctIndex + 1}`,
            // Drafts: the admin activates them from the table.
            is_active: false,
        });
    }

    const { error } = await supabase.from("questions").insert(rows);
    if (error) return { success: false, error: error.message };

    revalidatePath("/questions");
    return { success: true, inserted: rows.length };
}
