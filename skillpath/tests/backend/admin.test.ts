import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddUser } from '@/backend/admin/addUser'
import { updateUserRole } from '@/backend/admin/actions/roleChange'
import { getWeakCategories } from '@/backend/admin/getWeakCategories'
import { createClient } from '@/helper/supabase/server'
import { revalidatePath } from 'next/cache'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/supabase/server', () => {
    const client = { from: vi.fn(), auth: { getUser: vi.fn() } }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
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
        it('adds the user and invalidates the dashboard', async () => {
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

        it('returns a descriptive message when the insert fails', async () => {
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
        it('changes the user role', async () => {
            const queries = mockFrom(supabase.from, { users: { data: [{ id: 1 }], error: null } })

            const result = await updateUserRole(1, 'admin')

            expect(result).toEqual({ success: true })
            expect(queries.users[0].update).toHaveBeenCalledWith({ role: 'admin' })
            expect(queries.users[0].eq).toHaveBeenCalledWith('id', 1)
        })

        it('returns an error message when the update fails', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            mockFrom(supabase.from, { users: { data: null, error: { message: 'denied' } } })

            const result = await updateUserRole(1, 'admin')

            expect(result).toEqual({ success: false, message: 'Could not change role' })
            consoleSpy.mockRestore()
        })

        it('catches unexpected exceptions', async () => {
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
        // a category is only reported once it has more than 5 answers, so the
        // percentages are not computed on a handful of rows
        function answersFor(categoryId: number, name: string, total: number, wrong: number) {
            return Array.from({ length: total }, (_, i) => ({
                is_correct: i >= wrong,
                questions: { category_id: categoryId, categories: { id: categoryId, name } },
            }))
        }

        const answers = [
            ...answersFor(1, 'Frontend', 8, 4),
            ...answersFor(2, 'Backend', 6, 6),
            // row without a category -> must be ignored
            { is_correct: false, questions: { category_id: 3, categories: null } },
        ]

        it('computes the error percentage and sorts descending', async () => {
            mockFrom(supabase.from, { assessment_answers: { data: answers, error: null } })

            const result = await getWeakCategories()

            expect(result).toEqual([
                {
                    categoryId: 2,
                    categoryName: 'Backend',
                    wrongAnswersCount: 6,
                    totalAnswersCount: 6,
                    errorPercentage: 100,
                },
                {
                    categoryId: 1,
                    categoryName: 'Frontend',
                    wrongAnswersCount: 4,
                    totalAnswersCount: 8,
                    errorPercentage: 50,
                },
            ])
        })

        it('leaves out the categories with 5 answers or fewer', async () => {
            mockFrom(supabase.from, {
                assessment_answers: { data: answersFor(9, 'Testing', 5, 5), error: null },
            })

            const result = await getWeakCategories()

            expect(result).toEqual([])
        })

        it('filters by user when a userId is provided', async () => {
            const queries = mockFrom(supabase.from, {
                assessment_answers: { data: [], error: null },
            })

            await getWeakCategories(42)

            expect(queries.assessment_answers[0].eq).toHaveBeenCalledWith('assessments.user_id', 42)
        })

        it('returns an empty list and logs the error', async () => {
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
