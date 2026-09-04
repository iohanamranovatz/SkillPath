"use server";

import { createClient } from "@/helper/supabase/server";
const PASS_SCORE = 75; // scorul minim ca un test sa "conteze"

const rankOrder: Record<string, number> = {
    "Beginner": 1,
    "Intermediate": 2,
    "Advanced": 3
};

// Reevalueaza nivelul userului pe baza testelor trecute (>= 75%) si a
// numarului de categorii distincte acoperite. Consistenta pe latime, nu un varf.
export async function evaluateUserLevel(userId: number) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("assessments")
        .select("id, score_total, assessment_answers ( questions ( category_id ) )")
        .eq("user_id", userId)
        .eq("status", "completed");

    if (error || !data) return { success: false, message: error?.message, data: null };

    // testele trecute (scor >= 75%) + categoriile lor distincte
    let qualified = 0;
    const categories = new Set<number>();

    for (const a of data as any[]) {
        if ((a.score_total ?? 0) < PASS_SCORE) continue;
        qualified++;
        // categoria testului = categoria intrebarilor lui (generate dintr-o categorie)
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

    // nivelul calculat din tot istoricul (praguri ajustabile)
    // trebuie trecute teste (>=75%) in mai multe categorii DISTINCTE
    let level = "Beginner";
    if (qualified >= 6 && distinctCats >= 6) level = "Advanced";
    else if (qualified >= 4 && distinctCats >= 4) level = "Intermediate";

    if( rankOrder[level] < rankOrder[estimatedLevel]) {
        level = estimatedLevel;
    }

    await supabase.from("users").update({ estimated_level: level }).eq("id", userId);

    return { success: true, data: { level, qualified, distinctCats } };
}
