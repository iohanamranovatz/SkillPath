import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getAdminDashboardData } from '@/backend/admin/getAdminDashboardData'
import { createClient } from '@/helper/supabase/server'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/supabase/server', () => {
    const client = { from: vi.fn() }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
// data de referinta: miercuri, 2 septembrie 2026
const TODAY = new Date(2026, 8, 2, 12, 0, 0)

// helper: ISO pentru "acum minus N zile", in ora locala
function daysAgo(n: number) {
    const d = new Date(TODAY)
    d.setDate(TODAY.getDate() - n)
    return d.toISOString()
}

describe('backend/admin/getAdminDashboardData', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(TODAY)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    function seed(overrides: Record<string, any> = {}) {
        return mockFrom(supabase.from, {
            users: {
                data: [
                    { id: 1, name: 'Ana', email: 'ana@test.com', role: 'user' },
                    { id: 2, name: 'Bogdan', email: 'bogdan@test.com', role: 'user' },
                    { id: 3, name: 'Admin', email: 'admin@test.com', role: 'admin' },
                ],
                error: null,
            },
            assessments: {
                data: [
                    { id: 10, user_id: 1, status: 'completed', completed_at: daysAgo(0) },
                    { id: 11, user_id: 1, status: 'completed', completed_at: daysAgo(2) },
                    { id: 12, user_id: 2, status: 'completed', completed_at: daysAgo(1) },
                    // in afara ferestrei de 7 zile -> nu intra in activitate
                    { id: 13, user_id: 2, status: 'completed', completed_at: daysAgo(30) },
                    // fara data de finalizare -> ignorat la activitate
                    { id: 14, user_id: 1, status: 'completed', completed_at: null },
                    // in curs -> nu e numarat deloc
                    { id: 15, user_id: 2, status: 'in_progress', completed_at: null },
                    // user care nu exista in tabela users -> exclus din top
                    { id: 16, user_id: 99, status: 'completed', completed_at: daysAgo(1) },
                ],
                error: null,
            },
            questions: {
                data: [
                    { id: 1, is_active: true },
                    { id: 2, is_active: true },
                    { id: 3, is_active: false },
                ],
                error: null,
            },
            categories: {
                data: [
                    { id: 1, name: 'Frontend' },
                    { id: 2, name: 'Backend' },
                    { id: 3, name: 'Databases' },
                ],
                error: null,
            },
            assessment_answers: {
                data: [
                    { is_correct: false, questions: { category_id: 1, categories: { id: 1, name: 'Frontend' } } },
                    { is_correct: true, questions: { category_id: 1, categories: { id: 1, name: 'Frontend' } } },
                    { is_correct: false, questions: { category_id: 2, categories: { id: 2, name: 'Backend' } } },
                    { is_correct: false, questions: { category_id: 2, categories: { id: 2, name: 'Backend' } } },
                    // randuri incomplete -> ignorate
                    { is_correct: true, questions: null },
                    { is_correct: true, questions: { category_id: 3, categories: null } },
                ],
                error: null,
            },
            ...overrides,
        })
    }

    it('construieste cele patru carduri de statistici', async () => {
        seed()

        const { stats } = await getAdminDashboardData()

        expect(stats).toEqual([
            { title: 'Total Students', value: 2, change: '3 active' },
            { title: 'Assessments', value: 6, change: '+4 this week' },
            { title: 'Questions', value: 3, change: '2 active' },
            { title: 'Categories', value: 3, change: '2 in use' },
        ])
    })

    it('grupeaza activitatea pe ultimele 7 zile', async () => {
        seed()

        const { assessmentActivity } = await getAdminDashboardData()

        expect(assessmentActivity).toHaveLength(7)
        // ultima zi = azi (miercuri) cu un singur test finalizat
        expect(assessmentActivity[6]).toEqual({ day: 'Wed', fullDay: 'Wednesday', count: 1 })
        // ieri: 2 teste finalizate (unul al unui user inexistent)
        expect(assessmentActivity[5].count).toBe(2)
        expect(assessmentActivity.reduce((s, b) => s + b.count, 0)).toBe(4)
    })

    it('ordoneaza top users dupa numarul de teste si exclude adminii', async () => {
        seed()

        const { topUsers } = await getAdminDashboardData()

        expect(topUsers).toEqual([
            { id: '1', name: 'Ana', email: 'ana@test.com', count: 3, rank: 1 },
            { id: '2', name: 'Bogdan', email: 'bogdan@test.com', count: 2, rank: 2 },
        ])
    })

    it('sorteaza categoriile slabe dupa rata de greseala', async () => {
        seed()

        const { weakestCategories } = await getAdminDashboardData()

        expect(weakestCategories).toEqual([
            { id: '2', label: 'Backend', percentage: 100 },
            { id: '1', label: 'Frontend', percentage: 50 },
        ])
    })

    it('returneaza o structura goala cand nu exista date', async () => {
        mockFrom(supabase.from, {
            users: { data: null, error: { message: 'x' } },
            assessments: { data: null, error: null },
            questions: { data: null, error: null },
            categories: { data: null, error: null },
            assessment_answers: { data: null, error: null },
        })

        const data = await getAdminDashboardData()

        expect(data.topUsers).toEqual([])
        expect(data.weakestCategories).toEqual([])
        expect(data.assessmentActivity).toHaveLength(7)
        expect(data.stats[0]).toEqual({ title: 'Total Students', value: 0, change: '0 active' })
    })
})
