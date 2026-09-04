"use server";

import { createClient } from "@/helper/supabase/server";

export async function signUpUser(name: string, email: string, password: string)
{
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`,
            data: {
                full_name: name,
            }
        }
    });

    if (error) {
        return { success: false, message: error.message };
    }

    return {
        success: true,
        message: "The account has been created successfully! Please check your email to verify your account."
    };
}