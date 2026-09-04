"use server";

import { createClient } from "@/helper/supabase/server";
const PASS_SCORE = 75; // minimum score for a test to "count"

const rankOrder: Record<string, number> = {
    "Beginner": 1,
    "Intermediate": 2,
    "Advanced": 3
};

// Re-evaluates the user level based on passed tests (>= 75%) and the
// number of distinct categories covered. Breadth and consistency, not one peak.
export async function evaluateUserLevel(userId: number) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("assessments")
        .select("id, score_total, assessment_answers ( questions ( category_id ) )")
        .eq("user_id", userId)
        .eq("status", "completed");

    if (error || !data) return { success: false, message: error?.message, data: null };

    // passed tests (score >= 75%) + their distinct categories
    let qualified = 0;
    const categories = new Set<number>();

    for (const a of data as any[]) {
        if ((a.score_total ?? 0) < PASS_SCORE) continue;
        qualified++;
        // the test category = the category of its questions (generated from one category)
        const catId = a.assessment_answers?.[0]?.questions?.category_id;
        if (catId != null) categories.add(catId);
    }

    const distinctCats = categories.size;

    const { data: here} = await supabase
        .from("users")
        .select("estimated_level")
        .eq("id", userId)
        .single();

    const estimatedLevel = here?.estimated_level;

    // level computed from the whole history (thresholds are tunable)
    // tests (>=75%) must be passed in several DISTINCT categories
    let level = "Beginner";
    if (qualified >= 6 && distinctCats >= 6) level = "Advanced";
    else if (qualified >= 4 && distinctCats >= 4) level = "Intermediate";

    if( rankOrder[level] < rankOrder[estimatedLevel]) {
        level = estimatedLevel;
    }

    await supabase.from("users").update({ estimated_level: level }).eq("id", userId);

    return { success: true, data: { level, qualified, distinctCats } };
}
