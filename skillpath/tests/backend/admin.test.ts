import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddUser } from '@/backend/admin/addUser'
import { updateUserRole } from '@/backend/admin/actions/roleChange'
import { getWeakCategories } from '@/backend/admin/getWeakCategories'
import { supabase } from '@/helper/SupabaseClient'
import { revalidatePath } from 'next/cache'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/SupabaseClient', () => {
    const client = { from: vi.fn(), auth: { getUser: vi.fn() } }
    return { default: client, supabase: client }
})

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

function formData(fields: Record<string, string>) {
    const fd = new FormData()
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v))
    return fd
}

describe('backend/admin', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('AddUser', () => {
        it('adauga utilizatorul si invalideaza dashboard-ul', async () => {
            const created = { id: 1, name: 'Ana', email: 'ana@test.com' }
            const queries = mockFrom(supabase.from, { users: { data: created, error: null } })

            const result = await AddUser(
                formData({ email: 'ana@test.com', name: 'Ana', role: 'user', estimated_level: 'Beginner' })
            )

            expect(result).toEqual({ success: true, user: created })
            expect(queries.users[0].insert).toHaveBeenCalledWith([
                { email: 'ana@test.com', name: 'Ana', role: 'user', estimated_level: 'Beginner' },
            ])
            expect(revalidatePath).toHaveBeenCalledWith('/adminDashboard')
        })

        it.each([
            ['name', { email: 'a@b.c', name: '', role: 'user', estimated_level: 'Beginner' }],
            ['email', { email: '', name: 'Ana', role: 'user', estimated_level: 'Beginner' }],
            ['estimated_level', { email: 'a@b.c', name: 'Ana', role: 'user', estimated_level: '' }],
        ])('respinge formularul cand lipseste %s', async (_field, fields) => {
            const result = await AddUser(formData(fields))

            expect(result).toEqual({ success: false, message: 'All fields are required.' })
            expect(supabase.from).not.toHaveBeenCalled()
        })

        it('returneaza mesaj descriptiv cand insert-ul esueaza', async () => {
            mockFrom(supabase.from, { users: { data: null, error: { message: 'duplicate email' } } })

            const result = await AddUser(
                formData({ email: 'ana@test.com', name: 'Ana', role: 'user', estimated_level: 'Beginner' })
            )

            expect(result.success).toBe(false)
            expect(result.message).toBe('Error adding user with name: Ana : duplicate email')
            expect(revalidatePath).not.toHaveBeenCalled()
        })
    })

    describe('updateUserRole', () => {
        it('schimba rolul utilizatorului', async () => {
            const queries = mockFrom(supabase.from, { users: { data: [{ id: 1 }], error: null } })

            const result = await updateUserRole(1, 'admin')

            expect(result).toEqual({ success: true })
            expect(queries.users[0].update).toHaveBeenCalledWith({ role: 'admin' })
            expect(queries.users[0].eq).toHaveBeenCalledWith('id', 1)
        })

        it('returneaza mesaj de eroare cand update-ul esueaza', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            mockFrom(supabase.from, { users: { data: null, error: { message: 'denied' } } })

            const result = await updateUserRole(1, 'admin')

            expect(result).toEqual({ success: false, message: 'Could not change role' })
            consoleSpy.mockRestore()
        })

        it('prinde exceptiile neasteptate', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            vi.mocked(supabase.from).mockImplementation(() => {
                throw new Error('connection lost')
            })

            const result = await updateUserRole(1, 'admin')

            expect(result).toEqual({ success: false, message: 'Could not change role.' })
            consoleSpy.mockRestore()
        })
    })

    describe('getWeakCategories', () => {
        const answers = [
            {
                is_correct: false,
                questions: { category_id: 1, categories: { id: 1, name: 'Frontend' } },
            },
            {
                is_correct: true,
                questions: { category_id: 1, categories: { id: 1, name: 'Frontend' } },
            },
            {
                is_correct: false,
                questions: { category_id: 2, categories: { id: 2, name: 'Backend' } },
            },
            // rand fara categorie -> trebuie ignorat
            { is_correct: false, questions: { category_id: 3, categories: null } },
        ]

        it('calculeaza procentul de greseala si sorteaza descrescator', async () => {
            mockFrom(supabase.from, { assessment_answers: { data: answers, error: null } })

            const result = await getWeakCategories()

            expect(result).toEqual([
                {
                    categoryId: 2,
                    categoryName: 'Backend',
                    wrongAnswersCount: 1,
                    totalAnswersCount: 1,
                    errorPercentage: 100,
                },
                {
                    categoryId: 1,
                    categoryName: 'Frontend',
                    wrongAnswersCount: 1,
                    totalAnswersCount: 2,
                    errorPercentage: 50,
                },
            ])
        })

        it('filtreaza dupa user cand primeste userId', async () => {
            const queries = mockFrom(supabase.from, {
                assessment_answers: { data: [], error: null },
            })

            await getWeakCategories(42)

            expect(queries.assessment_answers[0].eq).toHaveBeenCalledWith('assessments.user_id', 42)
        })

        it('returneaza lista goala si logheaza eroarea', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            mockFrom(supabase.from, {
                assessment_answers: { data: null, error: { message: 'query failed' } },
            })

            const result = await getWeakCategories()

            expect(result).toEqual([])
            expect(consoleSpy).toHaveBeenCalledWith('Error getting weak categories: ', 'query failed')
            consoleSpy.mockRestore()
        })
    })
})
