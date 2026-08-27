"use server";

import supabase from "@/helper/SupabaseClient";
import { WeakCategory } from "@/frontend/admin/lib/types";

export async function getWeakCategories(userId?: number): Promise<WeakCategory[]> {
    let query = supabase
        .from("assessment_answers")
        .select(`
      is_correct,
      assessments!inner (
        user_id
      ),
      questions!inner (
        category_id,
        categories!inner (
          id,
          name
        )
      )
    `);

    // Daca primim un userId, filtram raspunsurile doar pentru acel student
    if (userId) {
        query = query.eq("assessments.user_id", userId);
    }

    const { data: answers, error } = await query;

    if (error || !answers) {
        console.error("Error getting weak categories: ", error?.message);
        return [];
    }

    const stats: Record<number, { name: string; wrong: number; total: number }> = {};

    answers.forEach((ans: any) => {
        const category = ans.questions?.categories;
        if (!category) return;

        const catId = category.id;
        const catName = category.name;

        if (!stats[catId]) {
            stats[catId] = { name: catName, wrong: 0, total: 0 };
        }

        stats[catId].total += 1;
        if (ans.is_correct === false) {
            stats[catId].wrong += 1;
        }
    });

    const result: WeakCategory[] = Object.keys(stats).map((key) => {
        const id = Number(key);
        const item = stats[id];
        const errorPercentage = item.total > 0 ? Math.round((item.wrong / item.total) * 100) : 0;

        return {
            categoryId: id,
            categoryName: item.name,
            wrongAnswersCount: item.wrong,
            totalAnswersCount: item.total,
            errorPercentage,
        };
    });

    return result.sort((a, b) => b.errorPercentage - a.errorPercentage);
}