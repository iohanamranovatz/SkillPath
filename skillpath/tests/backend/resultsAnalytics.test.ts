import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    getAssessmentAnalytics,
    getLatestAssessmentAnalytics,
} from '@/backend/user/results/getAssessmentAnalytics'
import { createClient } from '@/helper/supabase/server'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/supabase/server', () => {
    const client = { from: vi.fn(), auth: { getUser: vi.fn() } }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
const ANSWERS = [
    // React: 1 out of 3 correct -> 33% (weak area)
    { is_correct: true, questions: { tag_id: 1, tags: { id: 1, name: 'React' } } },
    { is_correct: false, questions: { tag_id: 1, tags: { id: 1, name: 'React' } } },
    { is_correct: false, questions: { tag_id: 1, tags: { id: 1, name: 'React' } } },
    // SQL: 1 out of 1 correct -> 100%
    { is_correct: true, questions: { tag_id: 2, tags: { id: 2, name: 'SQL' } } },
    // rows without a tag -> ignored
    { is_correct: false, questions: null },
    { is_correct: false, questions: { tag_id: 3, tags: null } },
]

describe('backend/user/results/getAssessmentAnalytics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('identifies the weak areas (below 60%) and their resources', async () => {
        const queries = mockFrom(supabase.from, {
            assessment_answers: { data: ANSWERS, error: null },
            learning_resources: {
                data: [{ id: 1, title: 'React Hooks', tag_id: 1 }],
                error: null,
            },
        })

        const result: any = await getAssessmentAnalytics(77)

        expect(result.weakAreas).toEqual([{ id: 1, name: 'React', percentage: 33 }])
        expect(result.recommendedResources).toEqual([{ id: 1, title: 'React Hooks', tag_id: 1 }])
        expect(queries.assessment_answers[0].eq).toHaveBeenCalledWith('assessment_id', 77)
        expect(queries.learning_resources[0].in).toHaveBeenCalledWith('tag_id', [1])
    })

    it('does not look for resources when there are no weak areas', async () => {
        const queries = mockFrom(supabase.from, {
            assessment_answers: {
                data: [{ is_correct: true, questions: { tag_id: 2, tags: { id: 2, name: 'SQL' } } }],
                error: null,
            },
        })

        const result: any = await getAssessmentAnalytics(77)

        expect(result.weakAreas).toEqual([])
        expect(result.recommendedResources).toEqual([])
        expect(queries.learning_resources).toBeUndefined()
    })

    it('returns an empty resource list when the query returns nothing', async () => {
        mockFrom(supabase.from, {
            assessment_answers: { data: ANSWERS, error: null },
            learning_resources: { data: null, error: null },
        })

        const result: any = await getAssessmentAnalytics(77)

        expect(result.recommendedResources).toEqual([])
    })

    it('reports the query error', async () => {
        mockFrom(supabase.from, {
            assessment_answers: { data: null, error: { message: 'db error' } },
        })

        const result: any = await getAssessmentAnalytics(77)

        expect(result).toEqual({ success: false, message: 'db error' })
    })
})

describe('backend/user/results/getLatestAssessmentAnalytics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns empty data when there is no authenticated user', async () => {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null } } as any)

        const result = await getLatestAssessmentAnalytics()

        expect(result).toEqual({ weakAreas: [], recommendedResources: [], stats: null })
        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('returns empty data when the user has no completed tests', async () => {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } } } as any)
        mockFrom(supabase.from, { assessments: { data: null, error: null } })

        const result = await getLatestAssessmentAnalytics()

        expect(result).toEqual({ weakAreas: [], recommendedResources: [], stats: null })
    })

    it('delegates the analysis to the latest completed test', async () => {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } } } as any)
        const queries = mockFrom(supabase.from, {
            assessments: { data: { id: 42 }, error: null },
            assessment_answers: { data: ANSWERS, error: null },
            learning_resources: { data: [], error: null },
        })

        const result: any = await getLatestAssessmentAnalytics()

        expect(queries.assessments[0].eq).toHaveBeenCalledWith('status', 'completed')
        expect(queries.assessment_answers[0].eq).toHaveBeenCalledWith('assessment_id', 42)
        expect(result.weakAreas).toEqual([{ id: 1, name: 'React', percentage: 33 }])
    })
})
