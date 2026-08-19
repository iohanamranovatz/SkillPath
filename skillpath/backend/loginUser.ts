"use server";

import { redirect } from 'next/navigation';
import { supabase } from '../helper/SupabaseClient';

export async function loginUser(email : string, password: string)
{

    const {error, data} = await supabase.auth.signInWithPassword({
        email : email,
        password: password 
    });
    if(error)
        return { succes:false, message: "Email sau parola incorecta!"};

    const userID=data.user.id;

    const { data : profile}= await supabase.from("users").select("role").eq("auth_key",userID).single();

    if( profile?.role=='admin')
            redirect('/adminDashboard');
        else
            redirect('/userDashboard');
}


