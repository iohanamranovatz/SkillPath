import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDashboardData } from '@/backend/user/getDashboardData'
import { createClient } from '@/helper/supabase/server'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/supabase/server', () => {
    const client = { from: vi.fn() }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
// 15 ianuarie 2026 si 10 februarie 2026, in ora locala
const JAN = new Date(2026, 0, 15, 12).toISOString()
const FEB = new Date(2026, 1, 10, 12).toISOString()

describe('backend/user/getDashboardData', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returneaza structura goala cand userul nu are teste finalizate', async () => {
        mockFrom(supabase.from, { assessments: { data: [], error: null } })

        const data = await getDashboardData(5)

        expect(data).toEqual({
            skills: [],
            scoreHistory: [],
            recentResults: [],
            recommendedResources: [],
        })
        // fara teste nu se mai interogheaza raspunsurile
        expect(supabase.from).toHaveBeenCalledTimes(1)
    })

    it('returneaza structura goala cand interogarea nu intoarce date', async () => {
        mockFrom(supabase.from, { assessments: { data: null, error: { message: 'x' } } })

        const data = await getDashboardData(5)

        expect(data.skills).toEqual([])
    })

    describe('cu istoric de teste', () => {
        function seed() {
            return mockFrom(supabase.from, {
                assessments: {
                    data: [
                        { id: 1, score_total: 80, completed_at: JAN },
                        { id: 2, score_total: 60, completed_at: JAN },
                        { id: 3, score_total: 40, completed_at: FEB },
                        // fara scor -> ignorat la graficul lunar
                        { id: 4, score_total: null, completed_at: FEB },
                        // fara data -> ignorat peste tot
                        { id: 5, score_total: 90, completed_at: null },
                    ],
                    error: null,
                },
                assessment_answers: {
                    data: [
                        // testul 1 -> Frontend, 2 din 2 corecte
                        { assessment_id: 1, is_correct: true, questions: { difficulty: 'EASY', category_id: 1, categories: { id: 1, name: 'Frontend' } } },
                        { assessment_id: 1, is_correct: true, questions: { difficulty: 'EASY', category_id: 1, categories: { id: 1, name: 'Frontend' } } },
                        // testul 3 -> Backend, 0 din 2 corecte (categorie slaba)
                        { assessment_id: 3, is_correct: false, questions: { difficulty: 'HARD', category_id: 2, categories: { id: 2, name: 'Backend' } } },
                        { assessment_id: 3, is_correct: false, questions: { difficulty: 'HARD', category_id: 2, categories: { id: 2, name: 'Backend' } } },
                        // randuri incomplete -> ignorate
                        { assessment_id: 2, is_correct: true, questions: null },
                        { assessment_id: 2, is_correct: true, questions: { difficulty: 'EASY', category_id: 3, categories: null } },
                    ],
                    error: null,
                },
                learning_resources: {
                    data: [
                        { id: 100, title: 'Node.js Guide', url: 'https://node.dev', type: 'article', category_id: 2 },
                    ],
                    error: null,
                },
            })
        }

        it('calculeaza procentul de raspunsuri corecte pe categorie', async () => {
            seed()

            const { skills } = await getDashboardData(5)

            expect(skills).toEqual([
                { skill: 'Frontend', score: 100 },
                { skill: 'Backend', score: 0 },
            ])
        })

        it('face media scorurilor pe luna, cronologic', async () => {
            seed()

            const { scoreHistory } = await getDashboardData(5)

            expect(scoreHistory).toEqual([
                { month: 'Jan', score: 70 },
                { month: 'Feb', score: 40 },
            ])
        })

        it('listeaza ultimele teste cu tema si dificultatea dominanta', async () => {
            seed()

            const { recentResults } = await getDashboardData(5)

            expect(recentResults).toHaveLength(4)
            // cel mai recent primul
            expect(recentResults[0]).toEqual({
                id: 3,
                title: 'Backend',
                topic: 'Backend',
                difficulty: 'Hard',
                score: 40,
                date: 'Feb 10',
            })
            expect(recentResults[2]).toMatchObject({
                id: 1,
                topic: 'Frontend',
                difficulty: 'Easy',
            })
            // test ale carui raspunsuri nu au categorie -> valori implicite
            expect(recentResults[3]).toMatchObject({
                id: 2,
                topic: 'General',
                difficulty: 'Medium',
            })
            // testul fara score_total primeste 0
            expect(recentResults.find((r) => r.id === 4)!.score).toBe(0)
            // testul fara data de finalizare este exclus
            expect(recentResults.some((r) => r.id === 5)).toBe(false)
        })

        it('recomanda resurse doar pentru categoriile sub 60%', async () => {
            const queries = seed()

            const { recommendedResources } = await getDashboardData(5)

            expect(queries.learning_resources[0].in).toHaveBeenCalledWith('category_id', [2])
            expect(recommendedResources).toEqual([
                {
                    id: 100,
                    title: 'Node.js Guide',
                    type: 'article',
                    url: 'https://node.dev',
                    reason: 'Boost your weakest area',
                },
            ])
        })
    })

    it('nu cauta resurse cand nu exista categorii slabe', async () => {
        const queries = mockFrom(supabase.from, {
            assessments: { data: [{ id: 1, score_total: 90, completed_at: JAN }], error: null },
            assessment_answers: {
                data: [
                    { assessment_id: 1, is_correct: true, questions: { difficulty: 'MEDIUM', category_id: 1, categories: { id: 1, name: 'Frontend' } } },
                ],
                error: null,
            },
        })

        const { recommendedResources, recentResults } = await getDashboardData(5)

        expect(recommendedResources).toEqual([])
        expect(queries.learning_resources).toBeUndefined()
        expect(recentResults[0].difficulty).toBe('Medium')
    })

    it('trateaza lipsa raspunsurilor fara sa arunce', async () => {
        mockFrom(supabase.from, {
            assessments: { data: [{ id: 1, score_total: 50, completed_at: JAN }], error: null },
            assessment_answers: { data: null, error: null },
        })

        const data = await getDashboardData(5)

        expect(data.skills).toEqual([])
        expect(data.recentResults[0]).toMatchObject({ topic: 'General', difficulty: 'Medium' })
    })
})
