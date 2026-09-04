"use server";

import { createClient } from "@/helper/supabase/server";

export async function resetPassword(password: string) {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        return { success: false, message: "Password update error" + error.message };
    }

    return { success: true , message: "Password updated successfully."};
}


export async function requestPasswordReset(email: string) {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://skill-path-pi-umber.vercel.app'}/reset-password`,
    });

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true };
}