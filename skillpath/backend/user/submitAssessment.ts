"use server";

import { supabase } from "@/helper/SupabaseClient";
import { evaluateUserLevel } from "@/backend/user/evaluateUserLevel";

export async function submitAssessment(
    assessmentId: number,
    answers: { questionId: number; optionId: string }[]
) {
    if (!assessmentId || answers.length === 0) {
        return { success: false, message: "Test invalid.", data: null };
    }

    // 1. luam raspunsurile corecte + categoria intrebarilor (DOAR pe server!)
    const questionIds = answers.map((a) => a.questionId);
    const { data: questions, error: qErr } = await supabase
        .from("questions")
        .select("id, correct_answer, category_id, categories ( name )")
        .in("id", questionIds);

    if (qErr) return { success: false, message: qErr.message, data: null };

    const qById = new Map<number, any>();
    (questions ?? []).forEach((q: any) => qById.set(q.id, q));

    // 2. corectam fiecare raspuns + tinem scor pe categorie
    const perCat = new Map<string, { correct: number; total: number }>();
    let correct = 0;

    for (const a of answers) {
        const q = qById.get(a.questionId);
        const isCorrect = q?.correct_answer === a.optionId;
        if (isCorrect) correct++;

        const catName = q?.categories?.name ?? "Necunoscut";
        const bucket = perCat.get(catName) ?? { correct: 0, total: 0 };
        bucket.total++;
        if (isCorrect) bucket.correct++;
        perCat.set(catName, bucket);

        await supabase
            .from("assessment_answers")
            .update({ selected_option_id: a.optionId, is_correct: isCorrect })
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
    const { data: owner } = await supabase
        .from("assessments")
        .select("user_id")
        .eq("id", assessmentId)
        .single();

    let level: string | null = null;
    if (owner?.user_id) {
        const lvl = await evaluateUserLevel(owner.user_id);
        level = lvl?.data?.level ?? null;
    }

    return { success: true, data: { correct, total, scorePct, perCategory, level } };
}
