import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signUpUser } from '@/backend/auth/signUpUser'
import signOut from '@/backend/auth/logout'
import { createClient } from '@/helper/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

vi.mock('@/helper/supabase/server', () => {
    const client = {
        auth: {
            signUp: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn(),
    }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('backend/auth', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('signUpUser', () => {
        it('creates the account and asks for email confirmation', async () => {
            vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
                data: { user: { id: 'u1' }, session: null },
                error: null,
            } as any)

            const result = await signUpUser('Ana', 'ana@test.com', 'parola123')

            expect(result.success).toBe(true)
            expect(result.message).toContain('created successfully')
        })

        it('sends the full name and the redirect url to Supabase', async () => {
            vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
                data: { user: null, session: null },
                error: null,
            } as any)

            await signUpUser('Ana Pop', 'ana@test.com', 'parola123')

            expect(supabase.auth.signUp).toHaveBeenCalledWith({
                email: 'ana@test.com',
                password: 'parola123',
                options: {
                    emailRedirectTo: expect.stringContaining('/login'),
                    data: { full_name: 'Ana Pop' },
                },
            })
        })

        it('returns the error message coming from Supabase', async () => {
            vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
                data: { user: null, session: null },
                error: { message: 'User already registered' },
            } as any)

            const result = await signUpUser('Ana', 'ana@test.com', 'parola123')

            expect(result).toEqual({ success: false, message: 'User already registered' })
        })
    })

    describe('signOut', () => {
        it('logs out, invalidates the cache and redirects to /login', async () => {
            vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null } as any)

            await signOut()

            expect(supabase.auth.signOut).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
            expect(redirect).toHaveBeenCalledWith('/login')
        })

        it('logs the error but still redirects', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
                error: { message: 'network' },
            } as any)

            await signOut()

            expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', 'network')
            expect(redirect).toHaveBeenCalledWith('/login')
            consoleSpy.mockRestore()
        })
    })
})
