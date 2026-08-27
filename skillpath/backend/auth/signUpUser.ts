"use server";

import { redirect } from "next/navigation";
import { supabase } from "../../helper/SupabaseClient";

export async function signUpUser(name: string, email: string, password: string)
{
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

    // if (data.user) {
    //     const { error: profileError } = await supabase.from("users").insert({
    //         auth_key: data.user.id,
    //         email: email,
    //         name: name,
    //         role: "user",
    //         estimated_level: "Beginner"
    //     });
    //
    //     if (profileError)
    //         console.error("Error creating user profile:", profileError.message);
    // }

    return {
        success: true,
        message: "The account has been created successfully! Please check your email to verify your account."
    };
}