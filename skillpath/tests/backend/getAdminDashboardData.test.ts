import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getAdminDashboardData } from '@/backend/admin/getAdminDashboardData'
import { createClient } from '@/helper/supabase/server'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/supabase/server', () => {
    const client = { from: vi.fn() }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
// reference date: Wednesday, 2 September 2026
const TODAY = new Date(2026, 8, 2, 12, 0, 0)

// helper: ISO for "now minus N days", in local time
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
                    // outside the 7-day window -> not counted in the activity
                    { id: 13, user_id: 2, status: 'completed', completed_at: daysAgo(30) },
                    // without a completion date -> ignored in the activity
                    { id: 14, user_id: 1, status: 'completed', completed_at: null },
                    // in progress -> not counted at all
                    { id: 15, user_id: 2, status: 'in_progress', completed_at: null },
                    // user that does not exist in the users table -> excluded from the top
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

    it('builds the four stat cards', async () => {
        seed()

        const { stats } = await getAdminDashboardData()

        expect(stats).toEqual([
            { title: 'Total Students', value: 2, change: '3 active' },
            { title: 'Assessments', value: 6, change: '+4 this week' },
            { title: 'Questions', value: 3, change: '2 active' },
            { title: 'Categories', value: 3, change: '2 in use' },
        ])
    })

    it('groups the activity over the last 7 days', async () => {
        seed()

        const { assessmentActivity } = await getAdminDashboardData()

        expect(assessmentActivity).toHaveLength(7)
        // last day = today (Wednesday) with a single completed test
        expect(assessmentActivity[6]).toEqual({ day: 'Wed', fullDay: 'Wednesday', count: 1 })
        // ieri: 2 teste finalizate (unul al unui user inexistent)
        expect(assessmentActivity[5].count).toBe(2)
        expect(assessmentActivity.reduce((s, b) => s + b.count, 0)).toBe(4)
    })

    it('orders top users by the number of tests and excludes admins', async () => {
        seed()

        const { topUsers } = await getAdminDashboardData()

        expect(topUsers).toEqual([
            { id: '1', name: 'Ana', email: 'ana@test.com', count: 3, rank: 1 },
            { id: '2', name: 'Bogdan', email: 'bogdan@test.com', count: 2, rank: 2 },
        ])
    })

    it('sorts the weak categories by error rate', async () => {
        seed()

        const { weakestCategories } = await getAdminDashboardData()

        expect(weakestCategories).toEqual([
            { id: '2', label: 'Backend', percentage: 100 },
            { id: '1', label: 'Frontend', percentage: 50 },
        ])
    })

    it('returns an empty structure when there is no data', async () => {
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
