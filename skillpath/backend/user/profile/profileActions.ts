"use server"

import { createClient } from "@/helper/supabase/server";
import {revalidatePath} from "next/cache";

export async function addObjective(userId: number, title: string) {
    const supabase = await createClient();

    if (!title.trim()) return;

    const { error } = await supabase
        .from("user_objectives")
        .insert({ user_id: userId, title, is_completed: false });

    if (error){
        console.error("Error adding objective:", error);
        return;
    }

    revalidatePath("/profile");
}

export async function toggleObjective(objectiveId: number, isCompleted: boolean) {
    const supabase = await createClient();

    await supabase
        .from("user_objectives")
        .update({ is_completed: !isCompleted })
        .eq("id", objectiveId);

    revalidatePath("/profile");
}

export async function deleteObjective(objectiveId: number) {
    const supabase = await createClient();

    await supabase
        .from("user_objectives")
        .delete()
        .eq("id", objectiveId);

    revalidatePath("/profile");
}

export async function toggleInterestTag(userId: number, categoryId: number, isSelected: boolean) {
    const supabase = await createClient();

    if (isSelected) {
        await supabase
            .from("user_interests")
            .delete()
            .eq("user_id", userId)
            .eq("category_id", categoryId);
    } else {
        await supabase
            .from("user_interests")
            .insert({ user_id: userId, category_id: categoryId });
    }

    revalidatePath("/profile");
}