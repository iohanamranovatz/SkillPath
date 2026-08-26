"use server";

import { supabase } from "../helper/SupabaseClient";
import {Resource} from "@/frontend/user/lib/types";

// --- Toate categoriile + numărul de întrebări (pentru lista principală) ---
export async function getCategories() {
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

// --- O categorie după id (pentru titlul paginii de detaliu) ---
export async function getCategoryById(id: number | string) {
    const { data, error } = await supabase
        .from("categories")
        .select("id, name, description")
        .eq("id", id)
        .single();

    if (error) return { success: false, message: error.message, data: null };
    return { success: true, data };
}

// --- Tagurile unei categorii (afișate + folosite în dropdown-ul de resurse) ---
export async function getCategoryTags(categoryId: number | string) {
    const { data, error } = await supabase
        .from("tags")
        .select("id, name")
        .eq("category_id", categoryId)
        .order("name", { ascending: true });

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data: data ?? [] };
}

// --- Resursele unei categorii (prin taguri: learning_resources -> tags -> category) ---
export async function getResourcesFromCategory(categoryId: number | string) {
    const { data, error } = await supabase
        .from("learning_resources")
        // tags!inner => face join și permite filtrarea după coloana din tags
        .select("id, title, url, type, tag_id, tags!inner(category_id, name)")
        .eq("tags.category_id", categoryId)
        .order("id", { ascending: false });

    if (error) return { success: false, message: error.message, data: [] };

    const resources = (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        type: r.type,
        tagId: r.tag_id,
        tagName: r.tags?.name ?? null,
    }));
    return { success: true, data: resources };
}

// --- Admin adaugă o resursă (legată de un TAG) ---
export async function addResource(input: {
    tagId: number;          // OBLIGATORIU — resursa aparține unui tag
    title: string;
    url?: string;
    type?: string;          // article | video | course
}) {
    if (!input.title?.trim())
        return { success: false, message: "Titlul este obligatoriu." };
    if (!input.tagId)
        return { success: false, message: "Alege un tag pentru resursă." };

    const { data, error } = await supabase
        .from("learning_resources")
        .insert({
            tag_id: input.tagId,
            title: input.title.trim(),
            url: input.url ?? null,
            type: input.type ?? "article",
        })
        .select()
        .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data, message: "Resursă adăugată!" };
}

// --- Admin editează o categorie ---
export async function updateCategory(input: {
    id: number;
    name: string;
    description?: string | null;
}) {
    if (!input.name?.trim())
        return { success: false, message: "Numele categoriei este obligatoriu." };

    const { data, error } = await supabase
        .from("categories")
        .update({ name: input.name.trim(), description: input.description ?? null })
        .eq("id", input.id)
        .select()
        .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data, message: "Categorie actualizată!" };
}

// --- Admin șterge o categorie ---
export async function deleteCategory(id: number) {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
        // 23503 = foreign key violation (are taguri/întrebări asociate)
        if (error.code === "23503")
            return {
                success: false,
                message: "Nu poți șterge categoria: are taguri sau întrebări asociate.",
            };
        return { success: false, message: error.message };
    }
    return { success: true, message: "Categorie ștearsă!" };
}

// --- Admin adaugă un tag la o categorie ---
export async function addTag(input: { categoryId: number; name: string }) {
    if (!input.name?.trim())
        return { success: false, message: "Numele tagului este obligatoriu." };

    const { data, error } = await supabase
        .from("tags")
        .insert({ category_id: input.categoryId, name: input.name.trim() })
        .select()
        .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data, message: "Tag adăugat!" };
}

// --- Admin editează un tag ---
export async function updateTag(input: { id: number; name: string }) {
    if (!input.name?.trim())
        return { success: false, message: "Numele tagului este obligatoriu." };

    const { data, error } = await supabase
        .from("tags")
        .update({ name: input.name.trim() })
        .eq("id", input.id)
        .select()
        .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data, message: "Tag actualizat!" };
}

// --- Admin șterge un tag ---
export async function deleteTag(id: number) {
    const { error } = await supabase.from("tags").delete().eq("id", id);

    if (error) {
        if (error.code === "23503")
            return {
                success: false,
                message: "Nu poți șterge tagul: are resurse sau întrebări asociate.",
            };
        return { success: false, message: error.message };
    }
    return { success: true, message: "Tag șters!" };
}

// --- Admin adaugă o categorie nouă ---
export async function addCategory(input: { name: string; description?: string }) {
    if (!input.name?.trim())
        return { success: false, message: "Numele categoriei este obligatoriu." };

    const { data, error } = await supabase
        .from("categories")
        .insert({ name: input.name.trim(), description: input.description ?? null })
        .select()
        .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data, message: "Categorie adăugată!" };
}

// --- Întrebările dintr-o categorie ---
export async function getQuestionsByCategory(categoryId: number | string) {
    const { data, error } = await supabase
        .from("questions")
        .select("id, question_text, difficulty, options, correct_answer, is_active, tag_id")
        .eq("category_id", categoryId)
        .order("id", { ascending: false });

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data: data ?? [] };
}

export async function getAllResources(): Promise<{ success: boolean; message?: string; data: Resource[] }> {
    const { data, error } = await supabase
        .from("learning_resources")
        .select("id, title, url, type, tag_id, tags(name)")
        .order("id", { ascending: false });

    if (error) return { success: false, message: error.message, data: [] };

    const resources: Resource[] = (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title ?? "",
        url: r.url ?? "",
        type: r.type ?? "Resource",
        tag: r.tags?.name ?? "General",
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
