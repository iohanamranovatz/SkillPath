"use server"

import { createClient } from "@/helper/supabase/server";

export async function getAssessmentAnalytics(assessmentId: number) {
    const supabase = await createClient();

    // load the saved answers together with the question tag
    // !inner = inner join
    const { data: answers, error } = await supabase
        .from("assessment_answers")
        .select(`
            is_correct,
            questions!inner (
                tag_id,
                tags (
                id,
                name
                )
            )
        `)
        .eq('assessment_id', assessmentId);

    if (error || !answers) return { success: false, message: error?.message };

    /**
     STRUCTURE used for the per-tag computation
     Record = dictionar (cheie - valoare)
     cheia: number ( id-ul tag-ului )
     valoarea: { name, total, correct }
     **/
    const tagStats: Record<number, { name: string, total: number, correct: number }> = {};

    answers.forEach((ans: any) => {
       // check that the question and the tag exist
       const question = ans.questions;

       // thanks to the answers fetched from Supabase above - line 8
       // .questions comes from ans.questions (the question_id relation)
        // .tags comes from question.tags (the tag_id relation -> tags table)

       if (!question || !question.tags) return;

       const tagId = question.tag_id;
       const tagName = question.tags.name;

       if (!tagStats[tagId]) {
           tagStats[tagId] = { name: tagName, total: 0, correct: 0 };
       }

       tagStats[tagId].total += 1;

       if (ans.is_correct) {
           tagStats[tagId].correct += 1;
       }
    });

    // identify Weak Areas -> the per-tag score is < 60%
    const weakTagIds: number[] = [];

    // array of detail objects sent to the frontend to be displayed
    const weakAreasList: { id: number; name: string; percentage: number }[] = [];

    Object.entries(tagStats).forEach(([tagIdStr, stat]) => {
        const tagId = Number(tagIdStr);
        const percentage = Math.round((stat.correct / stat.total) * 100);

        if (percentage < 60) {
            weakTagIds.push(tagId);
            weakAreasList.push({
                id: tagId,
                name: stat.name,
                percentage
            });
        }
    });

    // fetch the recommended resources from the DB for the weak tags
    let recommendedResources = [];

    if (weakTagIds.length > 0) {
        const { data: resources } = await supabase
            .from("learning_resources")
            .select("*")
            .in('tag_id', weakTagIds);

        recommendedResources = resources || [];
    }

    return {
        weakAreas: weakAreasList,
        recommendedResources
    };
}

export async function getLatestAssessmentAnalytics() {
    const supabase = await createClient();

    // get the logged-in user session directly from Supabase
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { weakAreas: [], recommendedResources: [], stats: null };
    }

    // find the latest completed test for this user
    const { data: latestAssessment } = await supabase
        .from('assessments')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

    // if there is no completed test, return empty data
    if (!latestAssessment) {
        return { weakAreas: [], recommendedResources: [], stats: null };
    }

    // 3. Run the existing logic using the id we found
    return await getAssessmentAnalytics(latestAssessment.id);
}