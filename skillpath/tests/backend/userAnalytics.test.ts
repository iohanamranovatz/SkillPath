import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    getAssessmentAnalytics,
    toggleResourceCompletion,
} from '@/backend/user/actions/getAssessmentAnalytics'
import { supabase } from '@/helper/SupabaseClient'
import { redirect } from 'next/navigation'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/SupabaseClient', () => {
    const client = { from: vi.fn(), auth: { getUser: vi.fn() } }
    return { default: client, supabase: client }
})

const ANSWERS = [
    // Frontend: 2 din 3 -> 67%
    { is_correct: true, questions: { category_id: 1, categories: { id: 1, name: 'Frontend' } } },
    { is_correct: true, questions: { category_id: 1, categories: { id: 1, name: 'Frontend' } } },
    { is_correct: false, questions: { category_id: 1, categories: { id: 1, name: 'Frontend' } } },
    // Backend: 0 din 2 -> 0% (zona slaba)
    { is_correct: false, questions: { category_id: 2, categories: { id: 2, name: 'Backend' } } },
    { is_correct: false, questions: { category_id: 2, categories: { id: 2, name: 'Backend' } } },
    // randuri incomplete -> ignorate
    { is_correct: true, questions: null },
    { is_correct: true, questions: { category_id: 3, categories: null } },
]

function authenticated(dbUser: any = { id: 5, estimated_level: 'Intermediate' }) {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'auth-1' } } } as any)
    return dbUser
}

describe('backend/user/actions/getAssessmentAnalytics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('agrega scorurile pe categorii si marcheaza resursele parcurse', async () => {
        const dbUser = authenticated()
        const queries = mockFrom(supabase.from, {
            users: { data: dbUser, error: null },
            assessments: {
                data: [
                    { id: 1, score_total: 80 },
                    { id: 2, score_total: 61 },
                ],
                error: null,
            },
            assessment_answers: { data: ANSWERS, error: null },
            learning_resources: {
                data: [
                    { id: 100, title: 'Node Guide', url: 'u1', type: 'article', category_id: 2, categories: { name: 'Backend' } },
                    { id: 101, title: 'SQL Basics', url: 'u2', type: 'video', category_id: 2, categories: { name: 'Backend' } },
                ],
                error: null,
            },
            user_progress: {
                data: [
                    { resource_id: 100, is_completed: true },
                    { resource_id: 101, is_completed: false },
                ],
                error: null,
            },
        })

        const result = await getAssessmentAnalytics()

        expect(result.scoreTotal).toBe(71) // media dintre 80 si 61, rotunjita
        expect(result.estimatedLevel).toBe('Intermediate')
        expect(result.categoryScores).toEqual([
            { id: 1, name: 'Frontend', percentage: 67 },
            { id: 2, name: 'Backend', percentage: 0 },
        ])
        expect(result.weakAreas).toEqual([{ id: 2, name: 'Backend', percentage: 0 }])
        expect(result.recommendedResources).toEqual([
            { id: 100, title: 'Node Guide', url: 'u1', type: 'article', categoryName: 'Backend', isCompleted: true },
            { id: 101, title: 'SQL Basics', url: 'u2', type: 'video', categoryName: 'Backend', isCompleted: false },
        ])
        expect(queries.assessments[0].eq).toHaveBeenCalledWith('user_id', 5)
        expect(queries.learning_resources[0].in).toHaveBeenCalledWith('category_id', [2])
    })

    it('returneaza valori implicite cand userul nu are teste finalizate', async () => {
        authenticated({ id: 5, estimated_level: null })
        mockFrom(supabase.from, {
            users: { data: { id: 5, estimated_level: null }, error: null },
            assessments: { data: [], error: null },
        })

        const result = await getAssessmentAnalytics()

        expect(result).toEqual({
            scoreTotal: 0,
            estimatedLevel: 'N/A',
            categoryScores: [],
            weakAreas: [],
            recommendedResources: [],
        })
    })

    it('returneaza doar scorul general cand raspunsurile nu pot fi citite', async () => {
        authenticated()
        mockFrom(supabase.from, {
            users: { data: { id: 5, estimated_level: 'Beginner' }, error: null },
            assessments: { data: [{ id: 1, score_total: 50 }], error: null },
            assessment_answers: { data: null, error: { message: 'boom' } },
        })

        const result = await getAssessmentAnalytics()

        expect(result).toEqual({
            scoreTotal: 50,
            estimatedLevel: 'Beginner',
            categoryScores: [],
            weakAreas: [],
            recommendedResources: [],
        })
    })

    it('trateaza scorurile lipsa ca 0 la calculul mediei', async () => {
        authenticated()
        mockFrom(supabase.from, {
            users: { data: { id: 5, estimated_level: 'Beginner' }, error: null },
            assessments: { data: [{ id: 1, score_total: null }, { id: 2, score_total: 100 }], error: null },
            assessment_answers: { data: [], error: null },
            user_progress: { data: null, error: null },
        })

        const result = await getAssessmentAnalytics()

        expect(result.scoreTotal).toBe(50)
        expect(result.recommendedResources).toEqual([])
    })

    it('redirectioneaza cand nu exista sesiune', async () => {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null } } as any)

        // dupa redirect (mock-uit, deci fara oprire) codul continua si arunca
        await expect(getAssessmentAnalytics()).rejects.toThrow()
        expect(redirect).toHaveBeenCalledWith('/')
    })

    it('redirectioneaza cand userul autentificat nu exista in baza de date', async () => {
        authenticated()
        mockFrom(supabase.from, { users: { data: null, error: null } })

        await expect(getAssessmentAnalytics()).rejects.toThrow()
        expect(redirect).toHaveBeenCalledWith('/')
    })
})

describe('backend/user/actions/toggleResourceCompletion', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('salveaza starea resursei pentru userul curent', async () => {
        authenticated()
        const queries = mockFrom(supabase.from, {
            users: { data: { id: 5, estimated_level: 'Beginner' }, error: null },
            user_progress: { error: null },
        })

        const result = await toggleResourceCompletion(100, true)

        expect(result).toEqual({ success: true })
        expect(queries.user_progress[0].upsert).toHaveBeenCalledWith(
            { user_id: 5, resource_id: 100, is_completed: true },
            { onConflict: 'user_id,resource_id' }
        )
    })

    it('raporteaza esecul salvarii', async () => {
        authenticated()
        mockFrom(supabase.from, {
            users: { data: { id: 5, estimated_level: 'Beginner' }, error: null },
            user_progress: { error: { message: 'denied' } },
        })

        const result = await toggleResourceCompletion(100, false)

        expect(result).toEqual({ success: false })
    })
})
