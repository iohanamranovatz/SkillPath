"use server"

import { createClient } from "@/helper/supabase/server";

export async function updateUserRole(userId: number, newRole: string) {
    const supabase = await createClient();

    try {

        const { data, error } = await supabase
            .from("users")
            .update({ role: newRole })
            .eq("id", userId)
            .select();

        if (error) {
            console.error("Error updating role", error.message);
            return {
                success: false,
                message: "Could not change role",
            }
        }

        return { success: true };
    } catch (err) {
        console.error("Error updating role", err);
        return { success: false, message: "Could not change role." }
    }

}