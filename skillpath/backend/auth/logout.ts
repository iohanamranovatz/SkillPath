"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/helper/supabase/server";

export default async function signOut() {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Error signing out:", error.message);
    }

    revalidatePath("/", "layout");
    redirect("/login");
    }