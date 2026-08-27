"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/helper/SupabaseClient";

// Guard pentru toate rutele din grupul (admin).
// Ruleaza in browser (unde exista sesiunea din localStorage) si lasa sa treaca
// doar userii logati cu rol de admin. Restul sunt redirectionati.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        let active = true;

        (async () => {
            // 1. e logat?
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                router.replace("/login");
                return;
            }

            // 2. are rol de admin?
            const { data: profile } = await supabase
                .from("users")
                .select("role")
                .eq("auth_key", user.id)
                .single();

            if (profile?.role !== "admin") {
                router.replace("/userDashboard"); // student -> il trimitem la dashboard-ul lui
                return;
            }

            if (active) setAllowed(true);
        })();

        return () => {
            active = false;
        };
    }, [router]);

    // pana verificam, nu aratam continutul de admin
    if (!allowed) return null; // poti pune aici un spinner
    return <>{children}</>;
}
