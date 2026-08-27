"use server";

import { supabase } from "@/helper/SupabaseClient";

const MAX_QUESTIONS = 10;

export type AssessmentQuestion = {
    id: number;
    question_text: string;
    difficulty: string;
    options: { id: string; text: string }[];
};
// generam testul: luam intrebarile active din categorie (dificultati amestecate)
export async function generateAssessment(userId: number, categoryId: number) {
    if (!userId || !categoryId) {
        return { success: false, message: "Please fill all the fields!", data: null };
    }

    const { data: questions, error: qErr } = await supabase
        .from("questions")
        .select("id, question_text, difficulty, options")
        .eq("category_id", categoryId)
        .eq("is_active", true);

    if (qErr) return { success: false, message: qErr.message, data: null };

    // amestecam si luam maxim N (nu esuam daca sunt mai putine)
    const picked = [...(questions ?? [])].sort(() => Math.random() - 0.5).slice(0, MAX_QUESTIONS);

    if (picked.length === 0) {
        return { success: false, message: "Sorry, no questions found!", data: null };
    }
    

      const { data: created, error: aErr } = await supabase
        .from("assessments")
        .insert({
            user_id: userId,
            status: "in_progress",
            started_at: new Date().toISOString(),
        })
        .select("id")
        .single();
    if (aErr || !created) {
        return { success: false, message: aErr?.message ?? "Nu s-a putut crea testul.", data: null };
    }
    const assessmentId = created.id;

    const answerRows = picked.map((q: any) => ({
        assessment_id: assessmentId,
        question_id: q.id,
        selected_option_id: null,
        is_correct: null,
    }));
    const { error: insErr } = await supabase.from("assessment_answers").insert(answerRows);
    if (insErr) {
        await supabase.from("assessments").delete().eq("id", assessmentId);
        return { success: false, message: insErr.message, data: null };
    }

    const clientQuestions: AssessmentQuestion[] = picked.map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        difficulty: q.difficulty,
        options: Array.isArray(q.options) ? q.options : [],
    }));

    return { success: true, data: { assessmentId, questions: clientQuestions } };
}
