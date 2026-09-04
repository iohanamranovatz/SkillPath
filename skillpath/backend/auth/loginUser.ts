"use server";

import { redirect } from 'next/navigation';
import { createClient } from "@/helper/supabase/server";

export async function loginUser(email : string, password: string)
{
    const supabase = await createClient();

    const {error, data} = await supabase.auth.signInWithPassword({
        email : email,
        password: password
    });

    if(error){
        // check whether the error is caused by an unconfirmed email
        if (error.message.includes("Email not confirmed")) {
            return {
                success: false,
                message: "Please confirm your email before logging in!"
            };
        }

        return {
            success: false,
            message: "Incorrect email or password!"
        };
    }
    const userID=data.user.id;

    const { data : profile}= await supabase.from("users").select("role").eq("auth_key",userID).single();

    if( profile?.role=='admin')
            redirect('/adminDashboard');
        else
            redirect('/userDashboard');
}


