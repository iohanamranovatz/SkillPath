"use server";

import { supabase } from "@/helper/SupabaseClient";

export async function saveSingleAnswer(
    assessmentId: number,
    questionId: number,
    optionId: string
) {
    const { error } = await supabase
        .from("assessment_answers")
        .update({ selected_option_id: optionId })
        .eq("assessment_id", assessmentId)
        .eq("question_id", questionId);

    if (error) {
        console.error("Auto-save failed:", error);
        return { success: false, message: error.message };
    }

    return { success: true };
}