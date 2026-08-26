import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginUser } from '@/backend/auth/loginUser'
import { supabase } from '@/helper/SupabaseClient'
import { redirect } from 'next/navigation'

vi.mock('@/helper/SupabaseClient', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
        },
        from: vi.fn(),
    },
}))

describe('loginUser Server Action', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('ar trebui sa returneze mesaj de confirmare email daca email-ul nu este confirmat', async () => {
        // Simulam raspuns de eroare "Email not confirmed" de la Supabase Auth
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { user: null, session: null },
            error: { message: 'Email not confirmed' } as any,
        })

        const result = await loginUser('test@email.com', 'parola123')

        expect(result).toEqual({
            succes: false,
            message: 'Va rugam sa va confirmati email-ul inainte de a va loga!',
        })
    })

    it('ar trebui sa returneze eroare pentru credentiale incorecte', async () => {
        // Simulam eroare generica (ex: Invalid login credentials)
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { user: null, session: null },
            error: { message: 'Invalid credentials' } as any,
        })

        const result = await loginUser('test@email.com', 'parolagresita')

        expect(result).toEqual({
            succes: false,
            message: 'Email sau parola incorecta!',
        })
    })

    it('ar trebui sa redirectioneze către /userDashboard dacă utilizatorul este normal', async () => {
        // 1. Mock pe login reusit
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { user: { id: 'user-123' } } as any,
            error: null,
        })

        // 2. Mock pe interogarea în tabelul 'users'
        const mockSingle = vi.fn().mockResolvedValueOnce({
            data: { role: 'user' },
            error: null,
        })
        const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

        await loginUser('user@email.com', 'parolaCorecta')

        // Verificăm că s-a verificat rolul pentru ID-ul corect
        expect(supabase.from).toHaveBeenCalledWith('users')
        expect(mockSelect).toHaveBeenCalledWith('role')
        expect(mockEq).toHaveBeenCalledWith('auth_key', 'user-123')

        // Verificăm redirecționarea
        expect(redirect).toHaveBeenCalledWith('/userDashboard')
    })

    it('ar trebui să redirecționeze către /adminDashboard dacă utilizatorul este admin', async () => {
        // 1. Mock pe login reuşit
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { user: { id: 'admin-123' } } as any,
            error: null,
        })

        // 2. Mock pe tabelul 'users' pentru rolul de admin
        const mockSingle = vi.fn().mockResolvedValueOnce({
            data: { role: 'admin' },
            error: null,
        })
        const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

        await loginUser('admin@email.com', 'parolaAdmin')

        // Verificăm redirecționarea către adminDashboard
        expect(redirect).toHaveBeenCalledWith('/adminDashboard')
    })
})