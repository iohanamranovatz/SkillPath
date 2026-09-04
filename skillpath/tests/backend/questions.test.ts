import {beforeEach, describe, expect, it, vi} from "vitest";
import {createQuestion, deleteQuestion, getQuestions, updateQuestion} from "@/backend/admin/actions/questions";
import {revalidatePath} from "next/cache";

import { createClient } from '@/helper/supabase/server'

// mock client
vi.mock('@/helper/supabase/server', () => {
    const mockSupabase = {
        from: vi.fn(),
    }
    return {
        default: mockSupabase,
        supabase: mockSupabase,
        createClient: () => mockSupabase,
    }
})


const supabase = createClient() as any
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('Questions Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getQuestions', () => {
        it('should fetch and map the questions successfully', async () => {
            const mockDbData = [
                {
                    id: 1,
                    title: 'Test Title',
                    question_text: 'What is Next.js?',
                    categories: { name: 'Frontend' },
                    difficulty: 'EASY',
                    options: [{ id: 'a', text: 'Framework' }, { id: 'b', text: 'Library' }],
                    correct_answer: 'a, b',
                    is_active: true
                }
            ]

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: mockDbData, error: null })
                })
            } as any)

            const result = await getQuestions()

            expect(result.success).toBe(true)
            expect(result.data).toEqual([
                {
                    id: '1',
                    title: 'Test Title',
                    text: 'What is Next.js?',
                    category: 'Frontend',
                    difficulty: 'EASY',
                    options: [{ id: 'a', text: 'Framework' }, { id: 'b', text: 'Library' }],
                    correctAnswersId: 'a',
                    isActive: true
                }
            ])
        })

        it('should return an error if the query fails', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
                })
            } as any)

            const result = await getQuestions()

            expect(result.success).toBe(false)
            expect(result.error).toBe('Database error')
        })
    })

    describe('createQuestion', () => {
        const validPayload = {
            title: 'New Q',
            text: 'What is Supabase?',
            category: 'Backend',
            difficulty: 'MEDIUM' as const,
            options: [{ id: '1', text: 'A' }, { id: '2', text: 'B' }, { id: '3', text: 'C' }],
            correctAnswersId: '1',
            isActive: true
        }

        it('should fail if the answer validation fails (zero correct)', async () => {
            const invalidPayload = { ...validPayload, correctAnswersId: "" }
            const result = await createQuestion(invalidPayload)

            expect(result.success).toBe(false)
            expect(result.error).toBe('You must select the correct answer.')
        })

        it('should fail if the category is not found', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                    })
                })
            } as any)

            const result = await createQuestion(validPayload)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Category 'Backend' not found.")
        })

        it('should create a question successfully', async () => {
            vi.mocked(supabase.from).mockImplementation((tableName: string) => {
                if (tableName === 'categories') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: { id: 10 }, error: null })
                            })
                        })
                    } as any
                }
                return {
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { id: 5, ...validPayload }, error: null })
                        })
                    })
                } as any
            })

            const result = await createQuestion(validPayload)

            expect(result.success).toBe(true)
            expect(result.data).toHaveProperty('id', 5)
            expect(revalidatePath).toHaveBeenCalledWith('/admin/questions')
        })
    })

    describe('updateQuestion', () => {
        const updatePayload = {
            text: 'Updated text',
            category: 'Frontend',
            difficulty: 'HARD' as const,
            options: [{ id: '1', text: 'A' }, { id: '2', text: 'B' }],
            correctAnswersId: '2',
            isActive: true
        }

        it('should update the question successfully', async () => {
            vi.mocked(supabase.from).mockImplementation((tableName: string) => {
                if (tableName === 'categories') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null })
                            })
                        })
                    } as any
                }
                return {
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            select: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: { id: 1, ...updatePayload }, error: null })
                            })
                        })
                    })
                } as any
            })

            const result = await updateQuestion('1', updatePayload)

            expect(result.success).toBe(true)
            expect(result.data).toHaveProperty('id', 1)
            expect(revalidatePath).toHaveBeenCalledWith('/admin/questions')
        })
    })

    describe('deleteQuestion', () => {
        it('should delete the question successfully', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null })
                })
            } as any)

            const result = await deleteQuestion('1')

            expect(result.success).toBe(true)
            expect(revalidatePath).toHaveBeenCalledWith('/admin/questions')
        })

        it('should return an error if the delete fails', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } })
                })
            } as any)

            const result = await deleteQuestion('1')

            expect(result.success).toBe(false)
            expect(result.error).toBe('Delete failed')
        })
    })
})

import { getAllCategories } from "@/backend/admin/actions/questions"

describe('getAllCategories', () => {
    it('should return a list of category names', async () => {
        const mockCategories = [{ name: 'Frontend' }, { name: 'Backend' }]

        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        } as any)

        const result = await getAllCategories()

        expect(result).toEqual(['Frontend', 'Backend'])
        expect(supabase.from).toHaveBeenCalledWith('categories')
    })

    it('should return an empty array on error', async () => {
        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Db error' } })
        } as any)

        const result = await getAllCategories()

        expect(result).toEqual([])
    })
})

