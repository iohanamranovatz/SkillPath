import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

// Client Supabase pentru server (server components + server actions).
// Sesiunea este citita/scrisa din cookies, nu din memoria procesului, ca sa
// functioneze si pe serverless (Vercel), unde fiecare request poate cadea pe
// alta instanta.
// cache() -> o singura instanta per request.
export const createClient = cache(() =>
    createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                async getAll() {
                    return (await cookies()).getAll();
                },
                async setAll(cookiesToSet) {
                    try {
                        const cookieStore = await cookies();
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // apelat dintr-un Server Component - refresh-ul token-ului
                        // este facut de middleware, deci putem ignora.
                    }
                },
            },
        }
    )
);

export default createClient;
