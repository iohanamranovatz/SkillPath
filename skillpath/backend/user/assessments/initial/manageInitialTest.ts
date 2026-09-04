import { createClient } from "@/helper/supabase/server";
import {INITIAL_ASSESSMENT_QUESTION_COUNT} from "@/backend/user/assessments/initial/initialAssessmentLifecycle";
import {getTests} from "@/backend/user/getTests";

const QUESTIONS_PER_DIFFICULTY = 10;

const categoryCursors = new Map<string, number>();

async function getMasteredQuestionIds(userId: number) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('assessment_answers')
        .select('question_id, assessments!inner(user_id)')
        .eq('assessments.user_id', userId)
        .eq('is_correct', true);

    if (error) throw new Error(`Failed to fetch correct answers: ${error.message}`);

    return (data ?? [])
        .map((row) => row.question_id)
        .filter((id): id is number => id !== null);
}

// No .eq('difficulty', ...) here — questions.difficulty is intentionally unused.
async function pickQuestion(
    categoryId: number,
    excludeIds: number[]
) {
    const supabase = await createClient();

    // Build the query from scratch every time: the count/head options
    // are applied ONLY on the first .select(); they cannot be re-applied on the already transformed builder.
    const buildQuery = (options?: { count: 'exact'; head?: boolean }) => {
        const query = supabase
            .from('questions')
            .select('*', options)
            .eq('category_id', categoryId)
            .eq('is_active', true)
            .order('id', { ascending: true }); // required for .range() to be meaningful

        return excludeIds.length > 0
            ? query.not('id', 'in', `(${excludeIds.join(',')})`)
            : query;
    };

    // 1. Get the count only, no rows.
    const { count, error: countError } = await buildQuery({ count: 'exact', head: true });

    if (countError) {
        throw new Error(`Failed to count questions: ${countError.message}`);
    }

    if (!count || count === 0) {
        return null; // nothing matches
    }

    // 2. Pick a random index within [0, count).
    const randomIndex = Math.floor(Math.random() * count);

    // 3. Fetch just that one row via range (offset randomIndex, single row).
    const { data, error } = await buildQuery().range(randomIndex, randomIndex);

    if (error) throw new Error(`Failed to fetch question: ${error.message}`);
    return data?.[0] ?? null;
}

export async function buildAssessmentQuestions(userId: number) {
    const supabase = await createClient();

    // categories.difficulty defines the 3 tiers we care about here.
    const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, difficulty')
        .order('id', { ascending: true });

    if (categoriesError) throw new Error(`Failed to fetch categories: ${categoriesError.message}`);

    const categoriesByDifficulty = new Map<string, number[]>();
    for (const c of categories ?? []) {
        if (!c.difficulty) continue;
        const list = categoriesByDifficulty.get(c.difficulty) ?? [];
        list.push(c.id);
        categoriesByDifficulty.set(c.difficulty, list);
    }

    const masteredIds = await getMasteredQuestionIds(userId);
    const pickedIds: number[] = []; // avoid duplicates within this run
    const questions: any[] = [];

    for (const [difficulty, categoryIds] of categoriesByDifficulty) {
        if (categoryIds.length === 0) continue;

        let cursor = categoryCursors.get(difficulty) ?? 0;

        // i resets 0..9 for each tier — this is the "modulo 10" boundary,
        // now expressed as one inner loop per difficulty group rather than
        // a flat 0..29 counter, since difficulty comes from categories, not questions.
        for (let i = 0; i < QUESTIONS_PER_DIFFICULTY; i++) {
            let found = false;

            for (let attempt = 0; attempt < categoryIds.length; attempt++) {
                const categoryId = categoryIds[cursor % categoryIds.length];
                cursor = (cursor + 1) % categoryIds.length; // always advance, hit or miss

                const question = await pickQuestion(categoryId, [
                    ...masteredIds,
                    ...pickedIds,
                ]);

                if (question) {
                    questions.push(question);
                    pickedIds.push(question.id);
                    found = true;
                    break;
                }
            }

            if (!found) {
                // Every category in this tier is exhausted for this user — skip the slot.
            }
        }

        // Persist where this tier's cursor landed — never reset to 0.
        categoryCursors.set(difficulty, cursor);
    }

    return questions;
}

export async function createInitialAssessment(userId: number
) {
    const supabase = await createClient();

    const questions = await buildAssessmentQuestions( userId);

    if (questions.length === 0) {
        throw new Error('No eligible questions found for this user.');
    }

    // 1. Create the assessment row.
    const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
            user_id: userId,
            status: 'in_progress',
            started_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (assessmentError) {
        throw new Error(`Failed to create assessment: ${assessmentError.message}`);
    }

    // 2. Insert one pending answer row per selected question.
    const answerRows = questions.map((q) => ({
        assessment_id: assessment.id,
        question_id: q.id,
        selected_option_id: null,
        is_correct: null,
    }));

    const { data: answers, error: answersError } = await supabase
        .from('assessment_answers')
        .insert(answerRows)
        .select();

    if (answersError) {
        throw new Error(`Failed to create assessment answers: ${answersError.message}`);
    }

    return { data : {questions: questions, assessmentId: assessment.id}, success: true, message: "Questions generated successfully." };
}

async function verifyAnswers(answers: { questionId: number; optionId: string }[]
): Promise<Map<number, boolean>> {
    const supabase = await createClient();

    const questionIds = answers.map((a) => a.questionId);

    const { data: questions, error } = await supabase
        .from('questions')
        .select('id, correct_answer')
        .in('id', questionIds);

    if (error) {
        throw new Error(`Failed to fetch questions for verification: ${error.message}`);
    }

    const correctAnswerById = new Map(
        (questions ?? []).map((q) => [q.id, q.correct_answer])
    );

    const result = new Map<number, boolean>();
    for (const { questionId, optionId } of answers) {
        const correctAnswer = correctAnswerById.get(questionId);
        result.set(questionId, correctAnswer != null && correctAnswer === optionId);
    }

    return result;
}


export async function submitInitialAssessment(
    assessmentId: number,
    answers: { questionId: number; optionId: string }[]
): Promise<number[]> {
    const supabase = await createClient();

    // 1. Verify correctness.
    const correctnessByQuestionId = await verifyAnswers(answers);

    // 2. Update each answer row with the selection + correctness.
    const updates = answers.map(({ questionId, optionId }) =>
        supabase
            .from('assessment_answers')
            .update({
                selected_option_id: optionId,
                is_correct: correctnessByQuestionId.get(questionId) ?? false,
            })
            .eq('assessment_id', assessmentId)
            .eq('question_id', questionId)
    );

    const updateResults = await Promise.all(updates);
    const updateError = updateResults.find((r) => r.error)?.error;
    if (updateError) {
        throw new Error(`Failed to update assessment answers: ${updateError.message}`);
    }

    // 3. Re-fetch all rows for this assessment, in insertion order, to chunk into tiers of 10.
    const { data: allAnswers, error: fetchError } = await supabase
        .from('assessment_answers')
        .select('id, is_correct')
        .eq('assessment_id', assessmentId)
        .order('id', { ascending: true });

    if (fetchError) {
        throw new Error(`Failed to fetch assessment answers: ${fetchError.message}`);
    }

    const CHUNK_SIZE = 10;
    const scoresByTier: number[] = [];
    for (let i = 0; i < (allAnswers?.length ?? 0); i += CHUNK_SIZE) {
        const chunk = allAnswers!.slice(i, i + CHUNK_SIZE);
        scoresByTier.push(chunk.filter((a) => a.is_correct === true).length);
    }

    const totalPossible = scoresByTier.length * 10;
    const totalCorrect = scoresByTier.reduce((sum, n) => sum + n, 0);
    const totalScore = totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0;
    // 4. Mark the assessment completed.
    const { error: completeError } = await supabase
        .from('assessments')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            score_total: totalScore,
        })
        .eq('id', assessmentId);

    if (completeError) {
        throw new Error(`Failed to mark assessment completed: ${completeError.message}`);
    }

    return scoresByTier; // e.g. [8, 6, 4]
}
