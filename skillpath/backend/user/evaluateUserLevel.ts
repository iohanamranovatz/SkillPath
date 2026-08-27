"use server";

import { supabase } from "@/helper/SupabaseClient";

const PASS_SCORE = 75; // scorul minim ca un test sa "conteze"

// Reevalueaza nivelul userului pe baza testelor trecute (>= 75%) si a
// numarului de categorii distincte acoperite. Consistenta pe latime, nu un varf.
export async function evaluateUserLevel(userId: number) {
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

    // nivelul calculat din tot istoricul (praguri ajustabile)
    let level = "Beginner";
    if (qualified >= 4 && distinctCats >= 3) level = "Advanced";
    else if (qualified >= 2 && distinctCats >= 2) level = "Intermediate";

    await supabase.from("users").update({ estimated_level: level }).eq("id", userId);

    return { success: true, data: { level, qualified, distinctCats } };
}
