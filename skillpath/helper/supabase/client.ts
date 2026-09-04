import { createBrowserClient } from "@supabase/ssr";

// Supabase client for "use client" components.
// Reads the same session from cookies as the server client.
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export default createClient;
