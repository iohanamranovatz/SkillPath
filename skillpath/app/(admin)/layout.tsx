import {redirect} from "next/navigation";
import { supabase } from "@/helper/SupabaseClient";
import AdminSidebar from "@/frontend/admin/components/Sidebar";
import AdminHeader from "@/frontend/admin/components/Header";
import AdminFooter from "@/frontend/admin/components/Footer";

// Guard pentru toate rutele din grupul (admin).
// doar userii logati cu rol de admin. Restul sunt redirectionati.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 1. este logat?
    if (authError || !user) {
        redirect("/login");
    }

    // 2. are rol de admin?
    const { data: profile } = await supabase
        .from("users")
        .select("role, name")
        .eq("auth_key", user.id)
        .single();

    if (profile?.role !== "admin") {
        redirect("/login");
    }

    return (
         <main>
             {children}
         </main>
    );
}