import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

// Supabase client for the server (server components + server actions).
// The session is read from / written to cookies, not process memory, so that
// it also works on serverless (Vercel), where each request may land on
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
                        // called from a Server Component - the token refresh
                        // is handled by the middleware, so this can be ignored.
                    }
                },
            },
        }
    )
);

export default createClient;
