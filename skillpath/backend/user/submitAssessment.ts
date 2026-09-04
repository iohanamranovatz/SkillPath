"use server";

import { createClient } from "@/helper/supabase/server";
import { evaluateUserLevel } from "@/backend/user/evaluateUserLevel";
import { isInitialAssessment } from "@/backend/user/assessments/initial/initialAssessmentLifecycle";

export async function submitAssessment(
    assessmentId: number,
    answers: { questionId: number; optionId: string }[]
) {
    const supabase = await createClient();

    if (!assessmentId || answers.length === 0) {
        return {success: false, message: "Test invalid.", data: null};
    }

    const initialAssessment = await isInitialAssessment(assessmentId);
    if (initialAssessment) {
        return {
            success: false,
            message: "Initial onboarding assessments are submitted through the onboarding flow.",
            data: null,
        };
    }

    const {data: owner} = await supabase
        .from("assessments")
        .select("user_id")
        .eq("id", assessmentId)
        .single();

    let level: string | null = "Beginner";

    // 1. luam raspunsurile corecte + categoria intrebarilor (DOAR pe server!)
    const questionIds = answers.map((a) => a.questionId);
    const {data: questions, error: qErr} = await supabase
        .from("questions")
        .select("id, correct_answer, category_id, categories ( name )")
        .in("id", questionIds);

    if (qErr) return {success: false, message: qErr.message, data: null};

    const qById = new Map<number, any>();
    (questions ?? []).forEach((q: any) => qById.set(q.id, q));

    // 2. corectam fiecare raspuns + tinem scor pe categorie
    const perCat = new Map<string, { correct: number; total: number }>();
    // raspunsurile corecte se trimit inapoi DOAR aici, dupa ce testul e predat
    const review: { questionId: number; selectedOptionId: string; correctOptionId: string | null; isCorrect: boolean }[] = [];
    let correct = 0;

    for (const a of answers) {
        const q = qById.get(a.questionId);
        const isCorrect = q?.correct_answer === a.optionId;
        if (isCorrect) correct++;

        review.push({
            questionId: a.questionId,
            selectedOptionId: a.optionId,
            correctOptionId: q?.correct_answer ?? null,
            isCorrect,
        });

        const catName = q?.categories?.name ?? "Unknown";
        const bucket = perCat.get(catName) ?? {correct: 0, total: 0};
        bucket.total++;
        if (isCorrect) bucket.correct++;
        perCat.set(catName, bucket);

        await supabase
            .from("assessment_answers")
            .update({selected_option_id: a.optionId, is_correct: isCorrect})
            .eq("assessment_id", assessmentId)
            .eq("question_id", a.questionId);
    }

    const total = answers.length;
    const scorePct = Math.round((correct / total) * 100);

    // scor procentual pe fiecare categorie
    const perCategory = Array.from(perCat.entries()).map(([category, v]) => ({
        category,
        score: Math.round((v.correct / v.total) * 100),
        correct: v.correct,
        total: v.total,
    }));

    // 3. salvam scorul total + marcam finalizat
    await supabase
        .from("assessments")
        .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            score_total: scorePct,
        })
        .eq("id", assessmentId);

    // 4. reevaluam nivelul userului (dupa ce scorul e salvat in DB)
    if (owner?.user_id) {
        const lvl = await evaluateUserLevel(owner.user_id);
        level = lvl?.data?.level ?? null;
    }

    return {success: true, data: {correct, total, scorePct, perCategory, level, review}};
}
