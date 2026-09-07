import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    INITIAL_ASSESSMENT_QUESTION_COUNT,
    getInitialAssessmentOnboardingState,
    isInitialAssessment,
} from "@/backend/user/assessments/initial/initialAssessmentLifecycle";
import {
    buildAssessmentQuestions,
    createInitialAssessment,
    submitInitialAssessment,
} from "@/backend/user/assessments/initial/manageInitialTest";
import {
    startInitialAssessment,
    submitInitialAssessmentAction,
} from "@/backend/user/assessments/initial/initialAssessmentActions";
import { createClient } from "@/helper/supabase/server";
import { mockFrom } from "../helpers/supabaseMock";

vi.mock("@/helper/supabase/server", () => {
    const client = { from: vi.fn() };
    return { default: client, supabase: client, createClient: () => client };
});

const supabase = createClient() as any;

/**
 * `pickQuestion` interogheaza tabela `questions` de doua ori pentru fiecare
 * intrebare aleasa: intai numara randurile, apoi ia unul singur prin .range().
 * Helperul construieste coada de raspunsuri pentru `slots` alegeri reusite.
 */
function questionPickQueue(slots: number, startId = 1) {
    const queue: any[] = [];
    for (let i = 0; i < slots; i++) {
        queue.push({ count: 5, error: null });
        queue.push({ data: [{ id: startId + i, question_text: `Q${startId + i}` }], error: null });
    }
    return queue;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("isInitialAssessment", () => {
    it("cere un id de assessment", async () => {
        mockFrom(supabase.from, {});

        await expect(isInitialAssessment(0)).rejects.toThrow("Assessment ID is required.");
    });

    it("recunoaste testul initial dupa numarul de raspunsuri", async () => {
        mockFrom(supabase.from, {
            assessment_answers: { count: INITIAL_ASSESSMENT_QUESTION_COUNT, error: null },
        });

        expect(await isInitialAssessment(12)).toBe(true);
    });

    it("respinge un assessment obisnuit", async () => {
        mockFrom(supabase.from, { assessment_answers: { count: 10, error: null } });

        expect(await isInitialAssessment(12)).toBe(false);
    });

    it("trateaza lipsa numaratorii ca zero raspunsuri", async () => {
        mockFrom(supabase.from, { assessment_answers: { error: null } });

        expect(await isInitialAssessment(12)).toBe(false);
    });

    it("propaga eroarea bazei de date", async () => {
        mockFrom(supabase.from, { assessment_answers: { error: { message: "boom" } } });

        await expect(isInitialAssessment(12)).rejects.toThrow("Failed to load assessment answers: boom");
    });
});

describe("getInitialAssessmentOnboardingState", () => {
    /** 30 de randuri de raspuns pentru assessment-ul dat. */
    function answersFor(...assessmentIds: number[]) {
        return assessmentIds.flatMap((assessment_id) =>
            Array.from({ length: INITIAL_ASSESSMENT_QUESTION_COUNT }, () => ({ assessment_id }))
        );
    }

    it("cere un id de utilizator", async () => {
        mockFrom(supabase.from, {});

        await expect(getInitialAssessmentOnboardingState(0)).rejects.toThrow("User ID is required.");
    });

    it("cere testul initial pentru un utilizator fara niciun assessment", async () => {
        mockFrom(supabase.from, { assessments: { data: [], error: null } });

        expect(await getInitialAssessmentOnboardingState(1)).toEqual({
            requiresInitialAssessment: true,
            activeInitialAssessmentId: null,
            completedInitialAssessmentId: null,
        });
    });

    it("trateaza data null la fel ca lista goala", async () => {
        mockFrom(supabase.from, { assessments: { data: null, error: null } });

        expect((await getInitialAssessmentOnboardingState(1)).requiresInitialAssessment).toBe(true);
    });

    it("gaseste testul initial in curs", async () => {
        mockFrom(supabase.from, {
            assessments: { data: [{ id: 5, status: "in_progress" }], error: null },
            assessment_answers: { data: answersFor(5), error: null },
        });

        const state = await getInitialAssessmentOnboardingState(1);

        expect(state.activeInitialAssessmentId).toBe(5);
        expect(state.completedInitialAssessmentId).toBeNull();
    });

    it("gaseste testul initial finalizat", async () => {
        mockFrom(supabase.from, {
            assessments: { data: [{ id: 5, status: "completed" }], error: null },
            assessment_answers: { data: answersFor(5), error: null },
        });

        const state = await getInitialAssessmentOnboardingState(1);

        expect(state.completedInitialAssessmentId).toBe(5);
        expect(state.activeInitialAssessmentId).toBeNull();
    });

    it("ignora assessment-urile obisnuite, cu alt numar de raspunsuri", async () => {
        mockFrom(supabase.from, {
            assessments: { data: [{ id: 8, status: "completed" }], error: null },
            assessment_answers: { data: [{ assessment_id: 8 }, { assessment_id: 8 }], error: null },
        });

        const state = await getInitialAssessmentOnboardingState(1);

        expect(state.completedInitialAssessmentId).toBeNull();
        expect(state.activeInitialAssessmentId).toBeNull();
    });

    it("distinge testul initial de un assessment obisnuit al aceluiasi utilizator", async () => {
        mockFrom(supabase.from, {
            assessments: {
                data: [
                    { id: 5, status: "completed" },
                    { id: 9, status: "in_progress" },
                ],
                error: null,
            },
            assessment_answers: { data: [...answersFor(5), { assessment_id: 9 }], error: null },
        });

        const state = await getInitialAssessmentOnboardingState(1);

        expect(state.completedInitialAssessmentId).toBe(5);
        expect(state.activeInitialAssessmentId).toBeNull();
    });

    it("propaga eroarea la incarcarea assessment-urilor", async () => {
        mockFrom(supabase.from, { assessments: { error: { message: "down" } } });

        await expect(getInitialAssessmentOnboardingState(1)).rejects.toThrow("Failed to load assessments: down");
    });

    it("propaga eroarea la incarcarea raspunsurilor", async () => {
        mockFrom(supabase.from, {
            assessments: { data: [{ id: 5, status: "completed" }], error: null },
            assessment_answers: { error: { message: "down" } },
        });

        await expect(getInitialAssessmentOnboardingState(1)).rejects.toThrow(
            "Failed to load assessment answers: down"
        );
    });
});

describe("buildAssessmentQuestions", () => {
    it("returneaza lista goala daca nicio categorie nu are dificultate setata", async () => {
        mockFrom(supabase.from, {
            categories: { data: [{ id: 1, difficulty: null }], error: null },
            assessment_answers: { data: [], error: null },
        });

        expect(await buildAssessmentQuestions(1)).toEqual([]);
    });

    it("sare peste sloturi cand categoria nu mai are intrebari disponibile", async () => {
        mockFrom(supabase.from, {
            categories: { data: [{ id: 1, difficulty: "EASY" }], error: null },
            assessment_answers: { data: [], error: null },
            questions: { count: 0, error: null },
        });

        expect(await buildAssessmentQuestions(1)).toEqual([]);
    });

    it("exclude intrebarile la care utilizatorul a raspuns deja corect", async () => {
        const queries = mockFrom(supabase.from, {
            categories: { data: [{ id: 1, difficulty: "EASY" }], error: null },
            assessment_answers: { data: [{ question_id: 42 }, { question_id: null }], error: null },
            questions: { count: 0, error: null },
        });

        await buildAssessmentQuestions(1);

        // `null` este filtrat, 42 ajunge in lista de excludere trimisa spre Supabase
        expect(queries.questions[0].not).toHaveBeenCalledWith("id", "in", "(42)");
    });

    it("aduna cate 10 intrebari per nivel de dificultate", async () => {
        mockFrom(supabase.from, {
            categories: { data: [{ id: 1, difficulty: "EASY" }], error: null },
            assessment_answers: { data: [], error: null },
            questions: questionPickQueue(10),
        });

        const questions = await buildAssessmentQuestions(1);

        expect(questions).toHaveLength(10);
        expect(new Set(questions.map((q) => q.id)).size).toBe(10);
    });

    it("propaga eroarea la incarcarea categoriilor", async () => {
        mockFrom(supabase.from, { categories: { error: { message: "nope" } } });

        await expect(buildAssessmentQuestions(1)).rejects.toThrow("Failed to fetch categories: nope");
    });

    it("propaga eroarea la incarcarea raspunsurilor corecte", async () => {
        mockFrom(supabase.from, {
            categories: { data: [{ id: 1, difficulty: "EASY" }], error: null },
            assessment_answers: { error: { message: "nope" } },
        });

        await expect(buildAssessmentQuestions(1)).rejects.toThrow("Failed to fetch correct answers: nope");
    });

    it("propaga eroarea la numararea intrebarilor", async () => {
        mockFrom(supabase.from, {
            categories: { data: [{ id: 1, difficulty: "EASY" }], error: null },
            assessment_answers: { data: [], error: null },
            questions: { error: { message: "nope" } },
        });

        await expect(buildAssessmentQuestions(1)).rejects.toThrow("Failed to count questions: nope");
    });

    it("propaga eroarea la citirea intrebarii alese", async () => {
        mockFrom(supabase.from, {
            categories: { data: [{ id: 1, difficulty: "EASY" }], error: null },
            assessment_answers: { data: [], error: null },
            questions: [
                { count: 3, error: null },
                { data: null, error: { message: "nope" } },
            ],
        });

        await expect(buildAssessmentQuestions(1)).rejects.toThrow("Failed to fetch question: nope");
    });
});

describe("createInitialAssessment", () => {
    it("refuza sa creeze un test fara intrebari eligibile", async () => {
        mockFrom(supabase.from, {
            categories: { data: [{ id: 1, difficulty: "EASY" }], error: null },
            assessment_answers: { data: [], error: null },
            questions: { count: 0, error: null },
        });

        await expect(createInitialAssessment(1)).rejects.toThrow("No eligible questions found for this user.");
    });

    it("creeaza assessment-ul si cate un rand de raspuns gol per intrebare", async () => {
        const queries = mockFrom(supabase.from, {
            categories: { data: [{ id: 1, difficulty: "EASY" }], error: null },
            assessment_answers: [
                { data: [], error: null },
                { data: [{ id: 1 }], error: null },
            ],
            questions: questionPickQueue(10, 100),
            assessments: { data: { id: 77 }, error: null },
        });

        const result = await createInitialAssessment(1);

        expect(result.success).toBe(true);
        expect(result.data.assessmentId).toBe(77);
        expect(result.data.questions).toHaveLength(10);

        const rows = queries.assessment_answers[1].insert.mock.calls[0][0];
        expect(rows).toHaveLength(10);
        expect(rows[0]).toEqual({
            assessment_id: 77,
            question_id: 100,
            selected_option_id: null,
            is_correct: null,
        });

        expect(queries.assessments[0].insert).toHaveBeenCalledWith(
            expect.objectContaining({ user_id: 1, status: "in_progress" })
        );
    });

    it("propaga eroarea la crearea assessment-ului", async () => {
        mockFrom(supabase.from, {
            categories: { data: [{ id: 1, difficulty: "EASY" }], error: null },
            assessment_answers: { data: [], error: null },
            questions: questionPickQueue(10, 200),
            assessments: { data: null, error: { message: "insert failed" } },
        });

        await expect(createInitialAssessment(1)).rejects.toThrow("Failed to create assessment: insert failed");
    });

    it("propaga eroarea la crearea randurilor de raspuns", async () => {
        mockFrom(supabase.from, {
            categories: { data: [{ id: 1, difficulty: "EASY" }], error: null },
            assessment_answers: [
                { data: [], error: null },
                { data: null, error: { message: "answers failed" } },
            ],
            questions: questionPickQueue(10, 300),
            assessments: { data: { id: 78 }, error: null },
        });

        await expect(createInitialAssessment(1)).rejects.toThrow(
            "Failed to create assessment answers: answers failed"
        );
    });
});

describe("submitInitialAssessment", () => {
    const answers = [
        { questionId: 1, optionId: "opt_1" },
        { questionId: 2, optionId: "opt_2" },
    ];

    /** 30 de raspunsuri: `correctPerTier` corecte in fiecare grup de 10. */
    function storedAnswers(correctPerTier: number[]) {
        return correctPerTier.flatMap((correct, tier) =>
            Array.from({ length: 10 }, (_, i) => ({ id: tier * 10 + i, is_correct: i < correct }))
        );
    }

    it("imparte raspunsurile in transe de cate 10", async () => {
        mockFrom(supabase.from, {
            questions: {
                data: [
                    { id: 1, correct_answer: "opt_1" },
                    { id: 2, correct_answer: "opt_9" },
                ],
                error: null,
            },
            assessment_answers: [
                { data: null, error: null },
                { data: null, error: null },
                { data: storedAnswers([8, 6, 4]), error: null },
            ],
            assessments: { data: null, error: null },
        });

        expect(await submitInitialAssessment(50, answers)).toEqual([8, 6, 4]);
    });

    it("marcheaza raspunsul corect si pe cel gresit", async () => {
        const queries = mockFrom(supabase.from, {
            questions: {
                data: [
                    { id: 1, correct_answer: "opt_1" },
                    { id: 2, correct_answer: "opt_9" },
                ],
                error: null,
            },
            assessment_answers: [
                { data: null, error: null },
                { data: null, error: null },
                { data: storedAnswers([1]), error: null },
            ],
            assessments: { data: null, error: null },
        });

        await submitInitialAssessment(50, answers);

        expect(queries.assessment_answers[0].update).toHaveBeenCalledWith({
            selected_option_id: "opt_1",
            is_correct: true,
        });
        expect(queries.assessment_answers[1].update).toHaveBeenCalledWith({
            selected_option_id: "opt_2",
            is_correct: false,
        });
    });

    it("trateaza o intrebare disparuta ca raspuns gresit", async () => {
        const queries = mockFrom(supabase.from, {
            questions: { data: [], error: null },
            assessment_answers: [
                { data: null, error: null },
                { data: null, error: null },
                { data: storedAnswers([0]), error: null },
            ],
            assessments: { data: null, error: null },
        });

        await submitInitialAssessment(50, answers);

        expect(queries.assessment_answers[0].update).toHaveBeenCalledWith({
            selected_option_id: "opt_1",
            is_correct: false,
        });
    });

    it("inchide assessment-ul cu scorul total calculat", async () => {
        const queries = mockFrom(supabase.from, {
            questions: { data: [{ id: 1, correct_answer: "opt_1" }], error: null },
            assessment_answers: [
                { data: null, error: null },
                { data: null, error: null },
                { data: storedAnswers([8, 6, 4]), error: null },
            ],
            assessments: { data: null, error: null },
        });

        await submitInitialAssessment(50, answers);

        expect(queries.assessments[0].update).toHaveBeenCalledWith(
            expect.objectContaining({ status: "completed", score_total: 60 })
        );
    });

    it("da scor 0 cand nu exista niciun raspuns stocat", async () => {
        const queries = mockFrom(supabase.from, {
            questions: { data: [], error: null },
            assessment_answers: [
                { data: null, error: null },
                { data: null, error: null },
                { data: [], error: null },
            ],
            assessments: { data: null, error: null },
        });

        expect(await submitInitialAssessment(50, answers)).toEqual([]);
        expect(queries.assessments[0].update).toHaveBeenCalledWith(
            expect.objectContaining({ score_total: 0 })
        );
    });

    it("propaga eroarea la verificarea intrebarilor", async () => {
        mockFrom(supabase.from, { questions: { error: { message: "gone" } } });

        await expect(submitInitialAssessment(50, answers)).rejects.toThrow(
            "Failed to fetch questions for verification: gone"
        );
    });

    it("propaga eroarea la salvarea raspunsurilor", async () => {
        mockFrom(supabase.from, {
            questions: { data: [], error: null },
            assessment_answers: { data: null, error: { message: "locked" } },
        });

        await expect(submitInitialAssessment(50, answers)).rejects.toThrow(
            "Failed to update assessment answers: locked"
        );
    });

    it("propaga eroarea la inchiderea assessment-ului", async () => {
        mockFrom(supabase.from, {
            questions: { data: [], error: null },
            assessment_answers: [
                { data: null, error: null },
                { data: null, error: null },
                { data: storedAnswers([5]), error: null },
            ],
            assessments: { error: { message: "conflict" } },
        });

        await expect(submitInitialAssessment(50, answers)).rejects.toThrow(
            "Failed to mark assessment completed: conflict"
        );
    });
});

describe("startInitialAssessment", () => {
    it("cere un id de utilizator", async () => {
        mockFrom(supabase.from, {});

        expect(await startInitialAssessment(0)).toEqual({
            success: false,
            message: "User ID is required.",
            data: null,
        });
    });

    it("reia testul initial lasat in curs", async () => {
        mockFrom(supabase.from, {
            assessments: { data: [{ id: 5, status: "in_progress" }], error: null },
            assessment_answers: {
                data: Array.from({ length: INITIAL_ASSESSMENT_QUESTION_COUNT }, () => ({ assessment_id: 5 })),
                error: null,
            },
        });

        expect(await startInitialAssessment(1)).toEqual({
            success: true,
            message: "Resumed existing initial assessment.",
            data: { assessmentId: 5, resumed: true },
        });
    });

    it("refuza un al doilea test initial", async () => {
        mockFrom(supabase.from, {
            assessments: { data: [{ id: 5, status: "completed" }], error: null },
            assessment_answers: {
                data: Array.from({ length: INITIAL_ASSESSMENT_QUESTION_COUNT }, () => ({ assessment_id: 5 })),
                error: null,
            },
        });

        expect(await startInitialAssessment(1)).toEqual({
            success: false,
            message: "Initial assessment already completed.",
            data: null,
        });
    });

    it("transforma o exceptie din stratul de date intr-un raspuns de eroare", async () => {
        mockFrom(supabase.from, { assessments: { error: { message: "down" } } });

        expect(await startInitialAssessment(1)).toEqual({
            success: false,
            message: "Failed to load assessments: down",
            data: null,
        });
    });
});

describe("submitInitialAssessmentAction", () => {
    const answers = [{ questionId: 1, optionId: "opt_1" }];

    it("respinge o trimitere fara raspunsuri", async () => {
        mockFrom(supabase.from, {});

        expect(await submitInitialAssessmentAction(5, [])).toEqual({
            success: false,
            message: "Assessment submission is invalid.",
            data: null,
        });
    });

    it("respinge un assessment care nu este cel initial", async () => {
        mockFrom(supabase.from, { assessment_answers: { count: 10, error: null } });

        expect(await submitInitialAssessmentAction(5, answers)).toEqual({
            success: false,
            message: "This assessment is not an initial onboarding assessment.",
            data: null,
        });
    });

    /** Pregateste tot lantul pana la actualizarea nivelului utilizatorului. */
    function seedSubmission(tiers: number[], answerCount: number) {
        const stored = tiers.flatMap((correct, tier) =>
            Array.from({ length: 10 }, (_, i) => ({ id: tier * 10 + i, is_correct: i < correct }))
        );

        return mockFrom(supabase.from, {
            assessment_answers: [
                { count: INITIAL_ASSESSMENT_QUESTION_COUNT, error: null },
                ...Array.from({ length: answerCount }, () => ({ data: null, error: null })),
                { data: stored, error: null },
            ],
            questions: { data: [{ id: 1, correct_answer: "opt_1" }], error: null },
            assessments: [
                { data: null, error: null },
                { data: { user_id: 3 }, error: null },
            ],
            users: { data: null, error: null },
        });
    }

    it("ramane Beginner cand primul nivel nu e depasit", async () => {
        seedSubmission([6, 10, 10], 1);

        const result = await submitInitialAssessmentAction(5, answers);

        expect(result.success).toBe(true);
        expect(result.data!.level).toBe("Beginner");
    });

    it("urca la Intermediate cand primul nivel e depasit", async () => {
        seedSubmission([7, 6, 0], 1);

        expect((await submitInitialAssessmentAction(5, answers)).data!.level).toBe("Intermediate");
    });

    it("urca la Advanced cand si al doilea nivel e depasit", async () => {
        seedSubmission([9, 8, 2], 1);

        expect((await submitInitialAssessmentAction(5, answers)).data!.level).toBe("Advanced");
    });

    it("salveaza nivelul estimat pe utilizator si raporteaza scorul", async () => {
        const queries = seedSubmission([1, 0, 0], 1);

        const result = await submitInitialAssessmentAction(5, answers);

        expect(queries.users[0].update).toHaveBeenCalledWith({ estimated_level: "Beginner" });
        expect(result.data).toEqual({
            correct: 1,
            total: 1,
            scorePct: 100,
            level: "Beginner",
            perCategory: [{ category: "All", score: 100, correct: 1, total: 1 }],
        });
    });

    it("esueaza daca nu poate identifica proprietarul assessment-ului", async () => {
        mockFrom(supabase.from, {
            assessment_answers: [
                { count: INITIAL_ASSESSMENT_QUESTION_COUNT, error: null },
                { data: null, error: null },
                { data: [], error: null },
            ],
            questions: { data: [], error: null },
            assessments: [
                { data: null, error: null },
                { data: null, error: { message: "no owner" } },
            ],
        });

        expect(await submitInitialAssessmentAction(5, answers)).toEqual({
            success: false,
            message: "no owner",
            data: null,
        });
    });

    it("esueaza daca nivelul nu poate fi salvat", async () => {
        mockFrom(supabase.from, {
            assessment_answers: [
                { count: INITIAL_ASSESSMENT_QUESTION_COUNT, error: null },
                { data: null, error: null },
                { data: [], error: null },
            ],
            questions: { data: [], error: null },
            assessments: [
                { data: null, error: null },
                { data: { user_id: 3 }, error: null },
            ],
            users: { error: { message: "read only" } },
        });

        expect(await submitInitialAssessmentAction(5, answers)).toEqual({
            success: false,
            message: "read only",
            data: null,
        });
    });

    it("transforma o exceptie din stratul de date intr-un raspuns de eroare", async () => {
        mockFrom(supabase.from, { assessment_answers: { error: { message: "down" } } });

        expect(await submitInitialAssessmentAction(5, answers)).toEqual({
            success: false,
            message: "Failed to load assessment answers: down",
            data: null,
        });
    });
});
