"use server"

import { createClient } from "@/helper/supabase/server";
import {redirect} from "next/navigation";
import {getCompletedTests} from "@/backend/user/getTests";

async function getAuthenticatedUser() {
    const supabase = await createClient();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/");

    const { data: dbUser } = await supabase
        .from("users")
        .select("id, estimated_level")
        .eq("auth_key", auth.user.id)
        .single();

    if (!dbUser) redirect("/");
    return dbUser;
}

export async function getAssessmentAnalytics() {
    const supabase = await createClient();

    const dbUser = await getAuthenticatedUser();

    // // 1. Fetch ALL completed tests of the user
    // const { data: userAssessments } = await supabase
    //     .from("assessments")
    //     .select("id, score_total")
    //     .eq("user_id", dbUser.id)
    //     .eq("status", "completed");
    //


    const userAssessments_res = await getCompletedTests(dbUser.id);

    const userAssessments = userAssessments_res.data.filter((test: any) => !test.isInitial)

    if (!userAssessments || userAssessments.length === 0) {
        return {
            scoreTotal: 0,
            estimatedLevel: dbUser.estimated_level || "N/A",
            categoryScores: [],
            weakAreas: [],
            recommendedResources: []
        };
    }

    // Compute the average total score across all tests
    const totalSum = userAssessments.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const overallScore = Math.round(totalSum / userAssessments.length);

    const assessmentIds = userAssessments.map(a => a.id);

    // 2. Fetch ALL answers from ALL completed tests
    const { data: answers, error } = await supabase
        .from("assessment_answers")
        .select(`
            is_correct,
            questions!inner (
                category_id,
                categories ( id, name )
            )
        `)
        .in("assessment_id", assessmentIds);

    if (error || !answers) {
        return {
            scoreTotal: overallScore,
            estimatedLevel: dbUser.estimated_level || "N/A",
            categoryScores: [],
            weakAreas: [],
            recommendedResources: []
        };
    }

    // 3. Aggregate the results per category (cumulative across all tests)
    const categoryStats: Record<number, { name: string; total: number; correct: number }> = {};

    answers.forEach((ans: any) => {
        const q = ans.questions;
        if (!q || !q.categories) return;

        const catId = q.category_id;
        const catName = q.categories.name;

        if (!categoryStats[catId]) {
            categoryStats[catId] = { name: catName, total: 0, correct: 0 };
        }

        categoryStats[catId].total += 1;
        if (ans.is_correct) categoryStats[catId].correct += 1;
    });

    // 4. Compute the overall percentage per category and identify Weak Areas (< 60%)
    const categoryScores: { id: number; name: string; percentage: number }[] = [];
    const weakCategoryIds: number[] = [];
    const weakAreas: { id: number; name: string; percentage: number }[] = [];

    Object.entries(categoryStats).forEach(([idStr, stat]) => {
        const id = Number(idStr);
        const percentage = Math.round((stat.correct / stat.total) * 100);
        const item = { id, name: stat.name, percentage };

        categoryScores.push(item);
        if (percentage < 60) {
            weakCategoryIds.push(id);
            weakAreas.push(item);
        }
    });

    // 5. Fetch the recommended resources for ALL accumulated weak categories
    let recommendedResources: any[] = [];
    if (weakCategoryIds.length > 0) {
        const { data: resources } = await supabase
            .from("learning_resources")
            .select("id, title, url, type, category_id, categories ( name )")
            .in("category_id", weakCategoryIds);

        recommendedResources = resources || [];
    }

    // 6. Check which resources the user has already ticked in user_progress
    const { data: userProgress } = await supabase
        .from("user_progress")
        .select("resource_id, is_completed")
        .eq("user_id", dbUser.id);

    const completedResourceIds = new Set(
        (userProgress || []).filter((p) => p.is_completed).map((p) => p.resource_id)
    );

    const resourcesWithStatus = recommendedResources.map((res) => ({
        id: res.id,
        title: res.title,
        url: res.url,
        type: res.type,
        categoryName: res.categories.name,
        isCompleted: completedResourceIds.has(res.id),
    }));

    return {
        scoreTotal: overallScore,
        estimatedLevel: dbUser.estimated_level || "N/A",
        categoryScores,
        weakAreas,
        recommendedResources: resourcesWithStatus
    };
}


// Action for ticking / unticking completed resources
export async function toggleResourceCompletion(resourceId: number, isCompleted: boolean) {
    const supabase = await createClient();

    const dbUser = await getAuthenticatedUser();

    const { error } = await supabase
        .from("user_progress")
        .upsert(
            {
                user_id: dbUser.id,
                resource_id: resourceId,
                is_completed: isCompleted,
            },
            { onConflict: "user_id,resource_id" }
        );

    return { success: !error };
}