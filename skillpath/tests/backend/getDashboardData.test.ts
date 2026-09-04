import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDashboardData } from '@/backend/user/getDashboardData'
import { createClient } from '@/helper/supabase/server'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/supabase/server', () => {
    const client = { from: vi.fn() }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
// 15 January 2026 and 10 February 2026, in local time
const JAN = new Date(2026, 0, 15, 12).toISOString()
const FEB = new Date(2026, 1, 10, 12).toISOString()

// getDashboardData reads the tests through getCompletedTests(), so the rows
// mocked on the `assessments` table must have the shape getTests() expects.
function completedTest(row: { id: number; score_total: number | null; completed_at: string | null }) {
    return {
        ...row,
        status: 'completed',
        started_at: row.completed_at,
        assessment_answers: [],
    }
}

describe('backend/user/getDashboardData', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns an empty structure when the user has no completed tests', async () => {
        mockFrom(supabase.from, { assessments: { data: [], error: null } })

        const data = await getDashboardData(5)

        expect(data).toEqual({
            skills: [],
            scoreHistory: [],
            recentResults: [],
            recommendedResources: [],
        })
        // without tests the answers are no longer queried
        expect(supabase.from).toHaveBeenCalledTimes(1)
    })

    it('returns an empty structure when the query returns no data', async () => {
        mockFrom(supabase.from, { assessments: { data: null, error: { message: 'x' } } })

        const data = await getDashboardData(5)

        expect(data.skills).toEqual([])
    })

    describe('with a test history', () => {
        function seed() {
            return mockFrom(supabase.from, {
                assessments: {
                    data: [
                        completedTest({ id: 1, score_total: 80, completed_at: JAN }),
                        completedTest({ id: 2, score_total: 60, completed_at: JAN }),
                        completedTest({ id: 3, score_total: 40, completed_at: FEB }),
                        // without a score -> ignored in the monthly chart
                        completedTest({ id: 4, score_total: null, completed_at: FEB }),
                        // without a date -> ignored everywhere
                        completedTest({ id: 5, score_total: 90, completed_at: null }),
                    ],
                    error: null,
                },
                assessment_answers: {
                    data: [
                        // test 1 -> Frontend, 2 out of 2 correct
                        { assessment_id: 1, is_correct: true, questions: { difficulty: 'EASY', category_id: 1, categories: { id: 1, name: 'Frontend' } } },
                        { assessment_id: 1, is_correct: true, questions: { difficulty: 'EASY', category_id: 1, categories: { id: 1, name: 'Frontend' } } },
                        // test 3 -> Backend, 0 out of 2 correct (weak category)
                        { assessment_id: 3, is_correct: false, questions: { difficulty: 'HARD', category_id: 2, categories: { id: 2, name: 'Backend' } } },
                        { assessment_id: 3, is_correct: false, questions: { difficulty: 'HARD', category_id: 2, categories: { id: 2, name: 'Backend' } } },
                        // incomplete rows -> ignored
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

        it('computes the percentage of correct answers per category', async () => {
            seed()

            const { skills } = await getDashboardData(5)

            expect(skills).toEqual([
                { skill: 'Frontend', score: 100 },
                { skill: 'Backend', score: 0 },
            ])
        })

        it('averages the scores per month, chronologically', async () => {
            seed()

            const { scoreHistory } = await getDashboardData(5)

            expect(scoreHistory).toEqual([
                { month: 'Jan', score: 70 },
                { month: 'Feb', score: 40 },
            ])
        })

        it('lists the latest tests with their dominant topic and difficulty', async () => {
            seed()

            const { recentResults } = await getDashboardData(5)

            expect(recentResults).toHaveLength(4)
            // the most recent one first
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
            // a test whose answers have no category -> default values
            expect(recentResults[3]).toMatchObject({
                id: 2,
                topic: 'General',
                difficulty: 'Medium',
            })
            // the test without score_total gets 0
            expect(recentResults.find((r) => r.id === 4)!.score).toBe(0)
            // the test without a completion date is excluded
            expect(recentResults.some((r) => r.id === 5)).toBe(false)
        })

        it('recommends resources only for the categories below 60%', async () => {
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

    it('does not look for resources when there are no weak categories', async () => {
        const queries = mockFrom(supabase.from, {
            assessments: { data: [completedTest({ id: 1, score_total: 90, completed_at: JAN })], error: null },
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

    it('handles missing answers without throwing', async () => {
        mockFrom(supabase.from, {
            assessments: { data: [completedTest({ id: 1, score_total: 50, completed_at: JAN })], error: null },
            assessment_answers: { data: null, error: null },
        })

        const data = await getDashboardData(5)

        expect(data.skills).toEqual([])
        expect(data.recentResults[0]).toMatchObject({ topic: 'General', difficulty: 'Medium' })
    })
})
