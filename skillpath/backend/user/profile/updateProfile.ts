"use server"

import { createClient } from "@/helper/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData)
{
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, message: "User not authenticated." };
    }

    const fullName = formData.get("fullName") as string;

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
        })
        .eq("id", dbUser.id);

    if (updateError) {
        return { success: false, message: "Failed to update profile." };
    }

    revalidatePath("/profile");

    return { success: true, message: "Profile updated successfully." };


}