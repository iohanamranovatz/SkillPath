"use server"

import supabase from "@/helper/SupabaseClient";
import {revalidatePath} from "next/cache";

export async function addObjective(userId: number, title: string) {
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
    await supabase
        .from("user_objectives")
        .update({ is_completed: !isCompleted })
        .eq("id", objectiveId);

    revalidatePath("/profile");
}

export async function deleteObjective(objectiveId: number) {
    await supabase
        .from("user_objectives")
        .delete()
        .eq("id", objectiveId);

    revalidatePath("/profile");
}

export async function toggleInterestTag(userId: number, tagId: number, isSelected: boolean) {
    if (isSelected) {
        await supabase
            .from("user_interests")
            .delete()
            .eq("user_id", userId)
            .eq("tag_id", tagId);
    } else {
        await supabase
            .from("user_interests")
            .insert({ user_id: userId, tag_id: tagId });
    }

    revalidatePath("/profile");
}