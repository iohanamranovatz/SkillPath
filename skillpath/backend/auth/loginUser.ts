"use server";

import { redirect } from 'next/navigation';
import { supabase } from '../../helper/SupabaseClient';

export async function loginUser(email : string, password: string)
{

    const {error, data} = await supabase.auth.signInWithPassword({
        email : email,
        password: password 
    });

    if(error){
        // verificare daca eroarea e legata de neconfirmarea email-ului
        if (error.message.includes("Email not confirmed")) {
            return {
                succes:false,
                message: "Va rugam sa va confirmati email-ul inainte de a va loga!"
            };
        }

        return {
            succes:false,
            message: "Email sau parola incorecta!"
        };
    }

    const userID=data.user.id;

    const { data : profile}= await supabase.from("users").select("role").eq("auth_key",userID).single();

    if( profile?.role=='admin')
            redirect('/adminDashboard');
        else
            redirect('/userDashboard');
}


