"use server";

import { createClient } from "@/helper/supabase/server";
import {Resource} from "@/frontend/user/lib/types";

// --- Toate categoriile + numarul de intrebari (pentru lista principala)
export async function getCategories() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("categories")
        .select("id, name, description, questions(count)")
        .order("id", { ascending: true });

    if (error) return { success: false, message: error.message, data: [] };

    const categories = (data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        exerciseCount: c.questions?.[0]?.count ?? 0,
    }));
    return { success: true, data: categories };
}

// --- O categorie dupa id (pentru titlul paginii de detaliu) ---
export async function getCategoryById(id: number | string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("categories")
        .select("id, name, description")
        .eq("id", id)
        .single();

    if (error) return { success: false, message: error.message, data: null };
    return { success: true, data };
}

// --- Tagurile unei categorii (afisate + folosite în dropdown-ul de resurse) ---
export async function getCategoryTags(categoryId: number | string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("tags")
        .select("id, name")
        .eq("category_id", categoryId)
        .order("name", { ascending: true });

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data: data ?? [] };
}

// --- Resursele unei categorii (direct prin category_id) ---
export async function getResourcesFromCategory(categoryId: number | string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("learning_resources")
        .select("id, title, url, type, category_id")
        .eq("category_id", categoryId)
        .order("id", { ascending: false });

    if (error) return { success: false, message: error.message, data: [] };

    const resources = (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        type: r.type,
        categoryId: r.category_id,
    }));
    return { success: true, data: resources };
}

// --- Admin adauga o resursa (direct in categorie) ---
export async function addResource(input: {
    categoryId: number;     // OBLIGATORIU — resursa apartine unei categorii
    title: string;
    url?: string;
    type?: string;          // article | video | course
}) {
    const supabase = await createClient();

    if (!input.title?.trim())
        return { success: false, message: "Please add title !" };
    if (!input.categoryId)
        return { success: false, message: "Missing category!" };

    const { data, error } = await supabase
        .from("learning_resources")
        .insert({
            category_id: input.categoryId,
            title: input.title.trim(),
            url: input.url ?? null,
            type: input.type ?? "article",
        })
        .select()
        .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data, message: "Resource was added!!" };
}

// --- Admin editeaza o categorie ---
export async function updateCategory(input: {
    id: number;
    name: string;
    description?: string | null;
    difficulty: string;
}) {
    const supabase = await createClient();

    if (!input.name?.trim())
        return { success: false, message: "Please add the name of the category!" };

    const { data, error } = await supabase
        .from("categories")
        .update({ name: input.name.trim(), description: input.description ?? null, difficulty: input.difficulty })
        .eq("id", input.id)
        .select()
        .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data, message: "Updated category!" };
}

// --- Admin sterge o categorie ---
export async function deleteCategory(id: number) {
    const supabase = await createClient();

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
        // 23503 = foreign key violation (are taguri/întrebari asociate)
        if (error.code === "23503")
            return {
                success: false,
                message: "You can't delete this category, questions and tags are tied to it.",
            };
        return { success: false, message: error.message };
    }
    return { success: true, message: "Categorie ștearsă!" };
}

// --- Admin adauga un tag la o categorie ---
export async function addTag(input: { categoryId: number; name: string }) {
    const supabase = await createClient();

    if (!input.name?.trim())
        return { success: false, message: "Tag Name is obligatory!" };

    const { data, error } = await supabase
        .from("tags")
        .insert({ category_id: input.categoryId, name: input.name.trim() })
        .select()
        .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data, message: "Added tag!" };
}

// --- Admin editeaza un tag ---
export async function updateTag(input: { id: number; name: string }) {
    const supabase = await createClient();

    if (!input.name?.trim())
        return { success: false, message: "Tag name is obligatory." };

    const { data, error } = await supabase
        .from("tags")
        .update({ name: input.name.trim() })
        .eq("id", input.id)
        .select()
        .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data, message: "Tag updated!" };
}

// --- Admin sterge un tag ---
export async function deleteTag(id: number) {
    const supabase = await createClient();

    const { error } = await supabase.from("tags").delete().eq("id", id);

    if (error) {
        if (error.code === "23503")
            return {
                success: false,
                message: "This tag cannot be deleted, questions are tied to it.",
            };
        return { success: false, message: error.message };
    }
    return { success: true, message: "Tag deleted!" };
}

// --- Admin adauga o categorie nouă ---
export async function addCategory(input: { name: string; description?: string; difficulty: string }) {
    const supabase = await createClient();

    if (!input.name?.trim())
        return { success: false, message: "Name of the category is obligatory." };

    const { data, error } = await supabase
        .from("categories")
        .insert({ name: input.name.trim(), description: input.description ?? null, difficulty: input.difficulty })
        .select()
        .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data, message: "Category added!" };
}

// --- Întrebările dintr-o categorie ---
export async function getQuestionsByCategory(categoryId: number | string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("questions")
        .select("id, question_text, difficulty, options, correct_answer, is_active, tag_id")
        .eq("category_id", categoryId)
        .order("id", { ascending: false });

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data: data ?? [] };
}

export async function getAllResources(categoryId?: number): Promise<{ success: boolean; message?: string; data: Resource[] }> {
    const supabase = await createClient();

    let query = supabase
        .from("learning_resources")
        .select("id, title, url, type, category_id, categories(name)")
        .order("id", { ascending: false });

    // Optional filter by category_id if provided
    if (categoryId !== undefined) {
        query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) return { success: false, message: error.message, data: [] };

    const resources: Resource[] = (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title ?? "",
        url: r.url ?? "",
        type: r.type ?? "Resource",
        category: r.categories?.name ?? "General",
    }));

    return { success: true, data: resources };
}

export async function fetchAllResourcesWrapper(): Promise<Resource[]> {
    const response = await getAllResources();

    if (!response.success) {
        console.error("Failed to fetch all resources:", response.message);
        return [];
    }

    // trebuie returnat doar array-ul de resurse, fără success/message
    return response.data;
}
