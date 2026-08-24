"use server"

import supabase from "@/helper/SupabaseClient";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData)
{
    const { data: {user}, error: authError } = await supabase.auth.getUser();

    if (authError) {
        return { success: false, message: authError.message };
    }

    if (!user) {
        return { success: false, message: "User not authenticated." };
    }

    const fullName = formData.get("fullName") as string;
    // const level = formData.get("estimated_level") as string;
    const interestTagName = formData.get("interestTagName") as string;

    const { data: dbUser, error: userFetchError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_key", user.id)
        .single();

    if (userFetchError || !dbUser) {
        return { success: false, message: "User not found in database." };
    }

    const { error: updateError } = await supabase
        .from("users")
        .update({
            name: fullName,
            // interest: interest
        })
        .eq("id", dbUser.id);

    if (updateError) {
        return { success: false, message: updateError.message };
    }

    if (interestTagName) {
        const { data: tag} = await supabase
            .from("tags")
            .select("id")
            .ilike("name", interestTagName)
            .maybeSingle();

        if (tag) {
            await supabase
                .from("user_interests")
                .delete().
                eq("user_id", dbUser.id);

            const { error: insertError } = await supabase
                .from("user_interests")
                .insert({
                    user_id: dbUser.id,
                    tag_id: tag.id
                });

            if (insertError) {
                console.error(insertError.message);
            } else {
                console.error("Tag '${interestTagName}' does not exist in the database.")
            }
        }
    }

    revalidatePath("/userDashboard", "page");

    return { success: true, message: "Profile updated successfully." };


}