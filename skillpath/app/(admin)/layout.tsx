import AdminSidebar from "@/frontend/admin/components/Sidebar";
import AdminHeader from "@/frontend/admin/components/Header";
import { createClient } from "@/helper/supabase/server";
import {redirect} from "next/navigation";

// Shared layout for all routes in the (admin) group.
// Renders the chrome (sidebar + header + footer) once around the pages.
// The session check is done server-side in every page (supabase.auth.getUser()).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 1. is the user logged in?
    if (authError || !user) {
        redirect("/login");
    }

    // 2. does the user have the admin role?
    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("auth_key", user.id)
        .single();

    if (profile?.role !== "admin") {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />

            <div className="flex flex-1 flex-col">
                <AdminHeader />

                <main className="flex-1 p-6 md:p-8">{children}</main>

            </div>
        </div>
    );
}
