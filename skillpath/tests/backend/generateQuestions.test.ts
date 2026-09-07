import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateQuestionDrafts, saveQuestionDrafts } from "@/backend/admin/actions/generateQuestions";
import { askJSON } from "@/backend/ai/client";
import { createClient } from "@/helper/supabase/server";
import { revalidatePath } from "next/cache";
import { mockFrom } from "../helpers/supabaseMock";

vi.mock("@/backend/ai/client", () => ({ askJSON: vi.fn() }));

vi.mock("@/helper/supabase/server", () => {
    const client = { from: vi.fn() };
    return { default: client, supabase: client, createClient: () => client };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const supabase = createClient() as any;

const CATEGORY = { id: 7, name: "Frontend", description: "Browser-side development" };

/** Patru optiuni distincte si non-goale - forma minima valida. */
function options(prefix = "opt") {
    return [`${prefix} A`, `${prefix} B`, `${prefix} C`, `${prefix} D`];
}

/** Aseaza categoria si intrebarile deja existente in baza de date. */
function seed(existingTexts: string[] = [], category: any = CATEGORY) {
    return mockFrom(supabase.from, {
        categories: { data: category, error: category ? null : { message: "not found" } },
        questions: { data: existingTexts.map((question_text) => ({ question_text })), error: null },
    });
}

/** Raspunsul modelului. */
function aiReturns(questions: any[]) {
    vi.mocked(askJSON).mockResolvedValue({ ok: true, data: { questions } } as any);
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("generateQuestionDrafts", () => {
    describe("preconditii", () => {
        it("esueaza daca nu gaseste categoria, fara sa cheme AI-ul", async () => {
            seed([], null);

            const result = await generateQuestionDrafts({ category: "Ceva", difficulty: "EASY", count: 3 });

            expect(result).toEqual({ success: false, error: "Category 'Ceva' not found." });
            expect(askJSON).not.toHaveBeenCalled();
        });

        it("propaga eroarea clientului AI", async () => {
            seed();
            vi.mocked(askJSON).mockResolvedValue({ ok: false, error: "The AI request timed out." } as any);

            const result = await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 3 });

            expect(result).toEqual({ success: false, error: "The AI request timed out." });
        });

        it("semnaleaza cand modelul nu returneaza nicio intrebare", async () => {
            seed();
            aiReturns([]);

            const result = await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 3 });

            expect(result).toEqual({ success: false, error: "The AI returned no questions." });
        });

        it("nu scrie nimic in baza de date", async () => {
            const queries = seed(["Ce este DOM-ul?"]);
            aiReturns([{ text: "Ce este un event listener?", options: options(), correctIndex: 1 }]);

            await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 1 });

            expect(queries.questions[0].insert).not.toHaveBeenCalled();
            expect(revalidatePath).not.toHaveBeenCalled();
        });
    });

    describe("promptul trimis modelului", () => {
        it("include categoria, dificultatea si lista de intrebari de evitat", async () => {
            seed(["Ce este DOM-ul?", "Ce este un event listener?"]);
            aiReturns([{ text: "Ce face flexbox?", options: options(), correctIndex: 0 }]);

            await generateQuestionDrafts({ category: "Frontend", difficulty: "HARD", count: 4 });

            const payload = JSON.parse(vi.mocked(askJSON).mock.calls[0][1]);
            expect(payload).toMatchObject({
                category: "Frontend",
                categoryDescription: "Browser-side development",
                difficulty: "HARD",
                count: 4,
                avoid: ["Ce este DOM-ul?", "Ce este un event listener?"],
            });
        });

        it("limiteaza numarul cerut la maximum 10", async () => {
            seed();
            aiReturns([{ text: "Ce face flexbox?", options: options(), correctIndex: 0 }]);

            await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 50 });

            expect(JSON.parse(vi.mocked(askJSON).mock.calls[0][1]).count).toBe(10);
        });

        it("ridica la 1 un numar invalid sau negativ", async () => {
            seed();
            aiReturns([{ text: "Ce face flexbox?", options: options(), correctIndex: 0 }]);

            await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: -3 });

            expect(JSON.parse(vi.mocked(askJSON).mock.calls[0][1]).count).toBe(1);
        });
    });

    describe("validarea formei", () => {
        const invalid: [string, any][] = [
            ["text gol", { text: "   ", options: options(), correctIndex: 0 }],
            ["trei optiuni", { text: "Intrebare?", options: ["A", "B", "C"], correctIndex: 0 }],
            ["cinci optiuni", { text: "Intrebare?", options: [...options(), "E"], correctIndex: 0 }],
            ["o optiune goala", { text: "Intrebare?", options: ["A", "B", "", "D"], correctIndex: 0 }],
            ["optiuni duplicate", { text: "Intrebare?", options: ["A", "B", "B", "D"], correctIndex: 0 }],
            ["correctIndex prea mare", { text: "Intrebare?", options: options(), correctIndex: 4 }],
            ["correctIndex negativ", { text: "Intrebare?", options: options(), correctIndex: -1 }],
            ["correctIndex zecimal", { text: "Intrebare?", options: options(), correctIndex: 1.5 }],
            ["correctIndex lipsa", { text: "Intrebare?", options: options() }],
            ["optiuni lipsa", { text: "Intrebare?", correctIndex: 0 }],
        ];

        it.each(invalid)("respinge %s", async (_label, question) => {
            seed();
            aiReturns([question]);

            const result = await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 1 });

            expect(result.success).toBe(false);
            expect(result.error).toBe("Every generated question failed validation. Try again.");
        });

        it("pastreaza intrebarile valide si numara cate a aruncat", async () => {
            seed();
            aiReturns([
                { text: "Buna 1?", options: options("a"), correctIndex: 0 },
                { text: "Stricata?", options: ["A", "B"], correctIndex: 0 },
                { text: "Buna 2?", options: options("b"), correctIndex: 3 },
                { text: "", options: options("c"), correctIndex: 0 },
            ]);

            const result = await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 4 });

            expect(result.success).toBe(true);
            expect(result.discarded).toBe(2);
            expect(result.drafts).toHaveLength(2);
            expect(result.drafts!.map((d) => d.text)).toEqual(["Buna 1?", "Buna 2?"]);
        });

        it("nu returneaza mai multe intrebari decat cele cerute", async () => {
            seed();
            aiReturns([
                { text: "Prima?", options: options("a"), correctIndex: 0 },
                { text: "A doua total diferita?", options: options("b"), correctIndex: 0 },
                { text: "A treia complet distincta?", options: options("c"), correctIndex: 0 },
            ]);

            const result = await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 2 });

            expect(result.drafts).toHaveLength(2);
        });

        it("normalizeaza spatiile din text si optiuni", async () => {
            seed();
            aiReturns([{ text: "  Ce face flexbox?  ", options: ["  A  ", "B", "C", "D"], correctIndex: 0 }]);

            const result = await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 1 });

            expect(result.drafts![0].text).toBe("Ce face flexbox?");
            expect(result.drafts![0].options[0]).toBe("A");
        });
    });

    describe("detectia duplicatelor", () => {
        it("marcheaza o reformulare a unei intrebari din baza de date", async () => {
            seed(["What is a variable in programming?"]);
            aiReturns([{ text: "What is a variable in programming exactly?", options: options(), correctIndex: 0 }]);

            const result = await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 1 });

            expect(result.drafts![0].duplicateOf).toBe("What is a variable in programming?");
            expect(result.drafts![0].similarity).toBeGreaterThanOrEqual(0.6);
        });

        it("da similaritate 1 pentru text identic dupa normalizare", async () => {
            seed(["What is a VARIABLE, exactly?"]);
            aiReturns([{ text: "what is a variable exactly", options: options(), correctIndex: 0 }]);

            const result = await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 1 });

            expect(result.drafts![0].similarity).toBe(1);
            expect(result.drafts![0].duplicateOf).toBe("What is a VARIABLE, exactly?");
        });

        it("nu marcheaza o intrebare pe alt subiect", async () => {
            seed(["What is a variable in programming?"]);
            aiReturns([
                { text: "Which HTTP status code indicates a permanent redirect?", options: options(), correctIndex: 0 },
            ]);

            const result = await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 1 });

            expect(result.drafts![0].duplicateOf).toBeNull();
            expect(result.drafts![0].similarity).toBeLessThan(0.6);
        });

        it("prinde duplicatele din interiorul aceluiasi batch", async () => {
            seed([]);
            aiReturns([
                { text: "What is a closure in JavaScript?", options: options("a"), correctIndex: 0 },
                { text: "What is a closure in JavaScript really?", options: options("b"), correctIndex: 0 },
            ]);

            const result = await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 2 });

            expect(result.drafts![0].duplicateOf).toBeNull();
            expect(result.drafts![1].duplicateOf).toBe("What is a closure in JavaScript?");
        });

        it("nu se lasa pacalit de cuvintele de umplutura comune", async () => {
            seed(["Which of the following is used to declare a constant?"]);
            aiReturns([
                { text: "Which of the following is used to iterate an array?", options: options(), correctIndex: 0 },
            ]);

            const result = await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 1 });

            expect(result.drafts![0].duplicateOf).toBeNull();
        });

        it("livreaza duplicatele pentru decizia adminului, nu le arunca", async () => {
            seed(["What is a variable in programming?"]);
            aiReturns([{ text: "What is a variable in programming exactly?", options: options(), correctIndex: 0 }]);

            const result = await generateQuestionDrafts({ category: "Frontend", difficulty: "EASY", count: 1 });

            expect(result.success).toBe(true);
            expect(result.drafts).toHaveLength(1);
            expect(result.discarded).toBe(0);
        });
    });
});

describe("saveQuestionDrafts", () => {
    const draft = { text: "Ce face flexbox?", options: options(), correctIndex: 2 };

    describe("respinge payload-uri invalide", () => {
        it("lista goala", async () => {
            seed();

            expect(await saveQuestionDrafts({ category: "Frontend", difficulty: "EASY", drafts: [] })).toEqual({
                success: false,
                error: "Nothing to save.",
            });
        });

        it("dificultate necunoscuta", async () => {
            seed();

            const result = await saveQuestionDrafts({
                category: "Frontend",
                difficulty: "IMPOSSIBLE" as any,
                drafts: [draft],
            });

            expect(result).toEqual({ success: false, error: "Invalid difficulty." });
        });

        it("categorie inexistenta", async () => {
            seed([], null);

            const result = await saveQuestionDrafts({ category: "Ceva", difficulty: "EASY", drafts: [draft] });

            expect(result).toEqual({ success: false, error: "Category 'Ceva' not found." });
        });

        it("revalideaza forma trimisa de client si nu insereaza nimic", async () => {
            const queries = seed();

            const result = await saveQuestionDrafts({
                category: "Frontend",
                difficulty: "EASY",
                drafts: [draft, { text: "Stricata?", options: ["A", "B"], correctIndex: 0 }],
            });

            expect(result).toEqual({ success: false, error: "A question failed validation and was not saved." });
            // tabelul `questions` nu e atins deloc - validarea pica inainte de insert
            expect(queries.questions).toBeUndefined();
        });

        it("respinge un correctIndex in afara intervalului chiar daca vine din client", async () => {
            seed();

            const result = await saveQuestionDrafts({
                category: "Frontend",
                difficulty: "EASY",
                drafts: [{ text: "Ce?", options: options(), correctIndex: 9 }],
            });

            expect(result.success).toBe(false);
        });
    });

    describe("inserarea", () => {
        it("salveaza ca inactiv, cu optiuni si raspuns corect consistente", async () => {
            const queries = seed();

            const result = await saveQuestionDrafts({ category: "Frontend", difficulty: "MEDIUM", drafts: [draft] });

            expect(result).toEqual({ success: true, inserted: 1 });

            const rows = queries.questions[0].insert.mock.calls[0][0];
            expect(rows).toEqual([
                {
                    question_text: "Ce face flexbox?",
                    category_id: 7,
                    difficulty: "MEDIUM",
                    options: [
                        { id: "opt_1", text: "opt A" },
                        { id: "opt_2", text: "opt B" },
                        { id: "opt_3", text: "opt C" },
                        { id: "opt_4", text: "opt D" },
                    ],
                    correct_answer: "opt_3",
                    is_active: false,
                },
            ]);
        });

        it("correct_answer indica intotdeauna o optiune care exista", async () => {
            const queries = seed();

            await saveQuestionDrafts({
                category: "Frontend",
                difficulty: "EASY",
                drafts: [{ text: "Ce?", options: options(), correctIndex: 0 }],
            });

            const [row] = queries.questions[0].insert.mock.calls[0][0];
            expect(row.options.map((o: any) => o.id)).toContain(row.correct_answer);
        });

        it("nu insereaza mai mult de 10 intrebari", async () => {
            const queries = seed();
            const many = Array.from({ length: 15 }, (_, i) => ({
                text: `Intrebarea ${i}?`,
                options: options(`o${i}`),
                correctIndex: 0,
            }));

            const result = await saveQuestionDrafts({ category: "Frontend", difficulty: "EASY", drafts: many });

            expect(result.inserted).toBe(10);
            expect(queries.questions[0].insert.mock.calls[0][0]).toHaveLength(10);
        });

        it("reimprospateaza lista de intrebari dupa salvare", async () => {
            seed();

            await saveQuestionDrafts({ category: "Frontend", difficulty: "EASY", drafts: [draft] });

            expect(revalidatePath).toHaveBeenCalledWith("/questions");
        });

        it("returneaza eroarea bazei de date si nu reimprospateaza", async () => {
            mockFrom(supabase.from, {
                categories: { data: CATEGORY, error: null },
                questions: { data: null, error: { message: "duplicate key value" } },
            });

            const result = await saveQuestionDrafts({ category: "Frontend", difficulty: "EASY", drafts: [draft] });

            expect(result).toEqual({ success: false, error: "duplicate key value" });
            expect(revalidatePath).not.toHaveBeenCalled();
        });
    });
});
