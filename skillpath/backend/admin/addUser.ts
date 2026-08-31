"use server"

import supabase from "@/helper/SupabaseClient";
import {revalidatePath} from "next/cache";

export async function AddUser(formData: FormData) {
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const estimated_level = formData.get("estimated_level") as string;

    if (!name || !email || !estimated_level) {
        return {
            success: false,
            message: "All fields are required."
        };
    }

    const { data, error } = await supabase
        .from("users")
        .insert([
            {
                email,
                name,
                role,
                estimated_level: estimated_level || "Beginner"
            }
        ])
        .select()
        .single();

    if (error) {
        return {
            success: false,
            message: "Error adding user with name: " + name + " : " + error.message
        };
    }

    revalidatePath("/adminDashboard");

    return {
        success: true,
        user: data
    }

}