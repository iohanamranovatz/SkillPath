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
        // Acum îl trimitem la /auth/callback, iar callback-ul îl va arunca în /reset-password
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
    });

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true, message: "Password reset email sent successfully." };
}
