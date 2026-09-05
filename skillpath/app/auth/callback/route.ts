import { NextResponse } from 'next/server';
import createClient from '@/helper/supabase/server';

export async function GET(request: Request) {
    // Extragem URL-ul, codul secret de la Supabase și destinația finală
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        // 1. Inițializăm Supabase pe server (unde are acces la cookies)
        const supabase = await createClient();

        // 2. Validăm codul secret. Aici se rezolvă eroarea aia cu "PKCE verifier"!
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // 3. Totul e în regulă. Trimitem user-ul la pagina de /reset-password (fără coduri în URL)
            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error("Eroare la validarea codului:", error.message);
        }
    }

    // Dacă link-ul a expirat sau nu există codul, îl dăm afară la login
    return NextResponse.redirect(`${origin}/login?error=Invalid_or_expired_link`);
}