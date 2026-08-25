"use server";

import { revalidatePath } from "next/cache";
import { Question, Option } from "@/frontend/admin/lib/types";
import supabase from "@/helper/SupabaseClient";

export type ActionResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
};

function validateAnswers(correctAnswerId: string | string[], options: Option[]): string | null {
    const selectedCount = Array.isArray(correctAnswerId) ? correctAnswerId.length : (correctAnswerId ? 1 : 0);
    if (selectedCount === 0) return "You must select at least one correct answer.";
    if (selectedCount >= options.length) return `You cannot select all ${options.length} options as correct.`;
    return null;
}

export async function getQuestions(): Promise<ActionResponse<Question[]>> {
    try {
        const { data, error } = await supabase
            .from("questions")
            .select(`
                *,
                categories (
                    name
                )
            `);

        if (error) throw new Error(error.message);

        const mappedQuestions: Question[] = data.map((row: any) => ({
            id: String(row.id),
            title: row.title || row.question_text.substring(0, 30) + "...",
            text: row.question_text,

            // Extract the joined name (with a fallback just in case the relation is null)
            category: row.categories?.name || String(row.category_id),

            difficulty: row.difficulty,
            options: row.options,
            correctAnswersId: row.correct_answer.split(",").map((id: string) => id.trim()),
            isActive: row.is_active
        }));

        return { success: true, data: mappedQuestions };
    } catch (error: any) {
        console.error("Error fetching questions:", error);
        return { success: false, error: error.message };
    }
}

export async function createQuestion(payload: Omit<Question, "id">): Promise<ActionResponse<Question>> {
    try {
        const validationError = validateAnswers(payload.correctAnswersId, payload.options);
        if (validationError) return { success: false, error: validationError };

        const { data: categoryID, error: categoryError } = await supabase
            .from("categories")
            .select("id")
            .eq("name", payload.category)
            .single();

        if (categoryError || !categoryID) {
            throw new Error(`Category '${payload.category}' not found.`);
        }

        const { data, error } = await supabase
            .from("questions")
            .insert([{
                question_text: payload.text,
                category_id: categoryID.id,
                difficulty: payload.difficulty.toUpperCase(),
                options: payload.options,
                correct_answer: payload.correctAnswersId,
                is_active: payload.isActive
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);

        revalidatePath("/admin/questions");
        return { success: true, data: data as any };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateQuestion(questionId: string, payload: Partial<Question>): Promise<ActionResponse<Question>> {
    try {
        if (payload.correctAnswersId !== undefined && payload.options !== undefined) {
            const validationError = validateAnswers(payload.correctAnswersId, payload.options);
            if (validationError) return { success: false, error: validationError };
        }

        const { data: categoryId, error: categoryError } = await supabase
            .from("categories")
            .select("id")
            .eq("name", payload.category)
            .single();

        if (categoryError || !categoryId) {
            throw new Error(`Category '${payload.category}' not found.`);
        }

        const { data, error } = await supabase
            .from("questions")
            .update({
                question_text: payload.text,
                category_id: categoryId ? categoryId.id : 0,
                difficulty: payload.difficulty,
                options: payload.options,
                correct_answer: payload.correctAnswersId,
                is_active: payload.isActive
            })
            .eq("id", parseInt(questionId))
            .select(`
                *,
                categories (
                    name
                )
            `)
            .single();

        if (error) throw new Error(error.message);

        revalidatePath("/admin/questions");
        return { success: true, data: data as any };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteQuestion(questionId: string): Promise<ActionResponse> {
    try {
        const { error } = await supabase
            .from("questions")
            .delete()
            .eq("id", parseInt(questionId));

        if (error) throw new Error(error.message);

        revalidatePath("/admin/questions");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllCategories(): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from("categories")
            .select("name");

        if (error) {
            console.error("Error fetching categories:", error.message);
            return [];
        }

        return data.map((row: any) => row.name);
    } catch (error: any) {
        console.error("Unexpected error fetching categories:", error.message);
        return [];
    }
}