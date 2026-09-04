import { describe, it, expect, vi, beforeEach } from 'vitest'
import { evaluateUserLevel } from '@/backend/user/evaluateUserLevel'
import { createClient } from '@/helper/supabase/server'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/supabase/server', () => {
    const client = { from: vi.fn() }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
describe('backend/user/evaluateUserLevel', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    function passedAssessments(count: number, distinctCategories: number) {
        return Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            score_total: 80,
            assessment_answers: [{ questions: { category_id: (i % distinctCategories) + 1 } }],
        }))
    }

    it('mentine Beginner cand nu sunt destule teste trecute', async () => {
        const queries = mockFrom(supabase.from, {
            assessments: { data: passedAssessments(2, 2), error: null },
            users: { error: null },
        })

        const result = await evaluateUserLevel(5)

        expect(result.data).toEqual({ level: 'Beginner', qualified: 2, distinctCats: 2 })
        expect(queries.users[0].update).toHaveBeenCalledWith({ estimated_level: 'Beginner' })
        expect(queries.users[0].eq).toHaveBeenCalledWith('id', 5)
    })

    it('promoveaza la Intermediate la 4 teste in 4 categorii distincte', async () => {
        mockFrom(supabase.from, {
            assessments: { data: passedAssessments(4, 4), error: null },
            users: { error: null },
        })

        const result = await evaluateUserLevel(5)

        expect(result.data!.level).toBe('Intermediate')
    })

    it('promoveaza la Advanced la 6 teste in 6 categorii distincte', async () => {
        mockFrom(supabase.from, {
            assessments: { data: passedAssessments(6, 6), error: null },
            users: { error: null },
        })

        const result = await evaluateUserLevel(5)

        expect(result.data).toEqual({ level: 'Advanced', qualified: 6, distinctCats: 6 })
    })

    it('ignora testele sub pragul de 75% si pe cele fara categorie', async () => {
        mockFrom(supabase.from, {
            assessments: {
                data: [
                    { id: 1, score_total: 74, assessment_answers: [{ questions: { category_id: 1 } }] },
                    { id: 2, score_total: null, assessment_answers: [] },
                    { id: 3, score_total: 90, assessment_answers: [] },
                ],
                error: null,
            },
            users: { error: null },
        })

        const result = await evaluateUserLevel(5)

        expect(result.data).toEqual({ level: 'Beginner', qualified: 1, distinctCats: 0 })
    })

    it('returneaza eroare cand interogarea esueaza', async () => {
        mockFrom(supabase.from, { assessments: { data: null, error: { message: 'db off' } } })

        const result = await evaluateUserLevel(5)

        expect(result).toEqual({ success: false, message: 'db off', data: null })
    })
})
