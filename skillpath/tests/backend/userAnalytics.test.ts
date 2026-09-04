import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    getAssessmentAnalytics,
    toggleResourceCompletion,
} from '@/backend/user/actions/getAssessmentAnalytics'
import { createClient } from '@/helper/supabase/server'
import { redirect } from 'next/navigation'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/supabase/server', () => {
    const client = { from: vi.fn(), auth: { getUser: vi.fn() } }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
const ANSWERS = [
    // Frontend: 2 out of 3 -> 67%
    { is_correct: true, questions: { category_id: 1, categories: { id: 1, name: 'Frontend' } } },
    { is_correct: true, questions: { category_id: 1, categories: { id: 1, name: 'Frontend' } } },
    { is_correct: false, questions: { category_id: 1, categories: { id: 1, name: 'Frontend' } } },
    // Backend: 0 out of 2 -> 0% (weak area)
    { is_correct: false, questions: { category_id: 2, categories: { id: 2, name: 'Backend' } } },
    { is_correct: false, questions: { category_id: 2, categories: { id: 2, name: 'Backend' } } },
    // incomplete rows -> ignored
    { is_correct: true, questions: null },
    { is_correct: true, questions: { category_id: 3, categories: null } },
]

// getAssessmentAnalytics reads the tests through getCompletedTests(), so the
// rows mocked on the `assessments` table must have the shape getTests() expects.
function completedTest(id: number, score_total: number | null) {
    return {
        id,
        score_total,
        status: 'completed',
        started_at: null,
        completed_at: null,
        assessment_answers: [],
    }
}

function authenticated(dbUser: any = { id: 5, estimated_level: 'Intermediate' }) {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'auth-1' } } } as any)
    return dbUser
}

describe('backend/user/actions/getAssessmentAnalytics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('aggregates the scores per category and marks the completed resources', async () => {
        const dbUser = authenticated()
        const queries = mockFrom(supabase.from, {
            users: { data: dbUser, error: null },
            assessments: {
                data: [
                    completedTest(1, 80),
                    completedTest(2, 61),
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

        expect(result.scoreTotal).toBe(71) // the average of 80 and 61, rounded
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

    it('returns default values when the user has no completed tests', async () => {
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

    it('returns only the overall score when the answers cannot be read', async () => {
        authenticated()
        mockFrom(supabase.from, {
            users: { data: { id: 5, estimated_level: 'Beginner' }, error: null },
            assessments: { data: [completedTest(1, 50)], error: null },
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

    it('treats missing scores as 0 when computing the average', async () => {
        authenticated()
        mockFrom(supabase.from, {
            users: { data: { id: 5, estimated_level: 'Beginner' }, error: null },
            assessments: { data: [completedTest(1, null), completedTest(2, 100)], error: null },
            assessment_answers: { data: [], error: null },
            user_progress: { data: null, error: null },
        })

        const result = await getAssessmentAnalytics()

        expect(result.scoreTotal).toBe(50)
        expect(result.recommendedResources).toEqual([])
    })

    it('redirects when there is no session', async () => {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null } } as any)

        // after the redirect (mocked, so execution is not stopped) the code continues and throws
        await expect(getAssessmentAnalytics()).rejects.toThrow()
        expect(redirect).toHaveBeenCalledWith('/')
    })

    it('redirects when the authenticated user does not exist in the database', async () => {
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

    it('saves the resource state for the current user', async () => {
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

    it('reports the save failure', async () => {
        authenticated()
        mockFrom(supabase.from, {
            users: { data: { id: 5, estimated_level: 'Beginner' }, error: null },
            user_progress: { error: { message: 'denied' } },
        })

        const result = await toggleResourceCompletion(100, false)

        expect(result).toEqual({ success: false })
    })
})
