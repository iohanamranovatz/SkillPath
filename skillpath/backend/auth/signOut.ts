"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import supabase from "@/helper/SupabaseClient";

export default async function signOut() {

    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Error signing out:", error.message);
    }

    revalidatePath("/", "layout");
    redirect("/login");
}