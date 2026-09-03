import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    getAssessmentAnalytics,
    getLatestAssessmentAnalytics,
} from '@/backend/user/results/getAssessmentAnalytics'
import { supabase } from '@/helper/SupabaseClient'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/SupabaseClient', () => {
    const client = { from: vi.fn(), auth: { getUser: vi.fn() } }
    return { default: client, supabase: client }
})

const ANSWERS = [
    // React: 1 din 3 corecte -> 33% (zona slaba)
    { is_correct: true, questions: { tag_id: 1, tags: { id: 1, name: 'React' } } },
    { is_correct: false, questions: { tag_id: 1, tags: { id: 1, name: 'React' } } },
    { is_correct: false, questions: { tag_id: 1, tags: { id: 1, name: 'React' } } },
    // SQL: 1 din 1 corect -> 100%
    { is_correct: true, questions: { tag_id: 2, tags: { id: 2, name: 'SQL' } } },
    // randuri fara tag -> ignorate
    { is_correct: false, questions: null },
    { is_correct: false, questions: { tag_id: 3, tags: null } },
]

describe('backend/user/results/getAssessmentAnalytics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('identifica zonele slabe (sub 60%) si resursele aferente', async () => {
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

    it('nu cauta resurse cand nu exista zone slabe', async () => {
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

    it('returneaza lista goala de resurse cand query-ul nu intoarce nimic', async () => {
        mockFrom(supabase.from, {
            assessment_answers: { data: ANSWERS, error: null },
            learning_resources: { data: null, error: null },
        })

        const result: any = await getAssessmentAnalytics(77)

        expect(result.recommendedResources).toEqual([])
    })

    it('semnaleaza eroarea de interogare', async () => {
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

    it('returneaza date goale cand nu exista utilizator autentificat', async () => {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null } } as any)

        const result = await getLatestAssessmentAnalytics()

        expect(result).toEqual({ weakAreas: [], recommendedResources: [], stats: null })
        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('returneaza date goale cand userul nu are teste finalizate', async () => {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'u1' } } } as any)
        mockFrom(supabase.from, { assessments: { data: null, error: null } })

        const result = await getLatestAssessmentAnalytics()

        expect(result).toEqual({ weakAreas: [], recommendedResources: [], stats: null })
    })

    it('deleaga analiza catre ultimul test completat', async () => {
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
