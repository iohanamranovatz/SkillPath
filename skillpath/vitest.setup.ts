import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Router-ul Next.js este partajat de toate testele; se poate inspecta cu
//   const router = (useRouter as any)()
const { router } = vi.hoisted(() => ({
    router: {
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
    },
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
    notFound: vi.fn(),
    useRouter: () => router,
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
}))

// Clientul Supabase real ar avea nevoie de variabile de mediu; in teste
// fiecare fisier isi pune propriul mock peste acesta acolo unde conteaza.
vi.mock('@/helper/SupabaseClient', () => {
    const client = {
        from: vi.fn(() => client),
        auth: {
            getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(async () => ({ error: null })),
        },
    }
    return { default: client, supabase: client }
})

afterEach(() => {
    cleanup()
})
