import { createBrowserClient } from "@supabase/ssr";

// Client Supabase pentru componente "use client".
// Citeste aceeasi sesiune din cookies ca si clientul de server.
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export default createClient;
