import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginUser } from '@/backend/auth/loginUser'
import { createClient } from '@/helper/supabase/server'
import { redirect } from 'next/navigation'

vi.mock('@/helper/supabase/server', () => {
    const client = {
        auth: {
            signInWithPassword: vi.fn(),
        },
        from: vi.fn(),
    }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
describe('loginUser Server Action', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return the email confirmation message when the email is not confirmed', async () => {
        // Simulate the "Email not confirmed" error response from Supabase Auth
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { user: null, session: null },
            error: { message: 'Email not confirmed' } as any,
        })

        const result = await loginUser('test@email.com', 'parola123')

        expect(result).toEqual({
            success: false,
            message: 'Please confirm your email before logging in!',
        })
    })

    it('should return an error for incorrect credentials', async () => {
        // Simulate a generic error (e.g. Invalid login credentials)
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { user: null, session: null },
            error: { message: 'Invalid credentials' } as any,
        })

        const result = await loginUser('test@email.com', 'parolagresita')

        expect(result).toEqual({
            success: false,
            message: 'Incorrect email or password!',
        })
    })

    it('should redirect to /userDashboard when the user is a regular user', async () => {
        // 1. Mock a successful login
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { user: { id: 'user-123' } } as any,
            error: null,
        })

        // 2. Mock the query on the 'users' table
        const mockSingle = vi.fn().mockResolvedValueOnce({
            data: { role: 'user' },
            error: null,
        })
        const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

        await loginUser('user@email.com', 'parolaCorecta')

        // Check that the role was looked up for the correct id
        expect(supabase.from).toHaveBeenCalledWith('users')
        expect(mockSelect).toHaveBeenCalledWith('role')
        expect(mockEq).toHaveBeenCalledWith('auth_key', 'user-123')

        // Check the redirect
        expect(redirect).toHaveBeenCalledWith('/userDashboard')
    })

    it('should redirect to /adminDashboard when the user is an admin', async () => {
        // 1. Mock a successful login
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { user: { id: 'admin-123' } } as any,
            error: null,
        })

        // 2. Mock the 'users' table for the admin role
        const mockSingle = vi.fn().mockResolvedValueOnce({
            data: { role: 'admin' },
            error: null,
        })
        const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

        await loginUser('admin@email.com', 'parolaAdmin')

        // Check the redirect to adminDashboard
        expect(redirect).toHaveBeenCalledWith('/adminDashboard')
    })
})