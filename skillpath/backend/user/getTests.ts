"use server";

import { createClient } from "@/helper/supabase/server";
import {
    INITIAL_ASSESSMENT_QUESTION_COUNT
} from "@/backend/user/assessments/initial/initialAssessmentLifecycle";

export async function getTests(userId:number){
    const supabase = await createClient();

    const {data, error} = await supabase.from("assessments")
        .select('id,status,score_total,started_at,completed_at' +
            ',assessment_answers ( selected_option_id, questions ( difficulty, categories (name) ) )')
        .eq("user_id",userId)
        .order("started_at", {ascending : false });

    if(error)
        return { succes:false, message: error.message, data : [] };

    const tests = (data ?? []).map((a: any) => {
        const answers = a.assessment_answers ?? [];

        // Count how many answers have selected_option_id as null
        const notAnswered = answers.filter((ans: any) => ans.selected_option_id !== null).length;

        // Folosim raspunsurile ca o punte spre categoria din care face parte testul
        const categories = Array.from(new Set(answers.map((ans: any) => ans.questions?.categories?.name).filter(Boolean))) as string[];

        return {
            id: a.id,
            categories,
            questions: answers.length,
            notAnswered,
            score: a.status == "completed" ? a.score_total : null,
            status: a.status,
            startedAt: a.started_at,
            completedAt: a.completed_at,
            progress: notAnswered.toString() + "0%",
            isInitial: answers.length === INITIAL_ASSESSMENT_QUESTION_COUNT,
        }
    });


    const initial = tests.some((test: any) => test.isInitial);

    return {success: true, data: tests, hasInitial: initial};
}


export async function getCompletedTests(userId: number) {
    const allTests = await getTests(userId);
    if (!allTests.success) return {success: false, message: "error fetching tests", data: [] };

    return {data: allTests.data.filter((test: any) => test.status === "completed"),
        hasInitial: allTests.hasInitial, success: allTests.success, message: " completed_tests"};
}