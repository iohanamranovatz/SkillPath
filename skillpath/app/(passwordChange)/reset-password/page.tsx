import {ResetPasswordForm} from "@/frontend/auth/ResetPasswordForm";
import { createClient } from "@/helper/supabase/server";
import {redirect} from "next/navigation";

export default async function ResetPasswordPage() {

    const supabase = await createClient();
    const { data: { user }, error: error } = await supabase.auth.getUser();

    // If the user is already logged in normally, redirect them to the dashboard
    if (user || error) {
        redirect("/");
    }

    return (
        <main>
            <ResetPasswordForm/>
        </main>
    );
}