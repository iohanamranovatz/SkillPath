import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { redirect } from 'next/navigation'
import { supabase } from '@/helper/SupabaseClient'
import { mockFrom } from '../helpers/supabaseMock'

import Home from '@/app/page'
import LoginPage from '@/app/login/page'
import SignupPage from '@/app/signup/page'
import UserDashboardPage from '@/app/(user)/userDashboard/page'
import ProfilePage from '@/app/(user)/profile/page'
import NewTestPage from '@/app/(user)/assessment/new/page'
import AssessmentPage from '@/app/(user)/assessment/[id]/page'
import AssessmentResultsPage from '@/app/(user)/assessment/[id]/completed/page'

import { fetchAllResourcesWrapper } from '@/backend/categories'
import { getTests } from '@/backend/user/getTests'
import { getDashboardData } from '@/backend/user/getDashboardData'

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
    usePathname: () => '/userDashboard',
    useSearchParams: () => new URLSearchParams(),
    // in Next.js redirect() opreste executia aruncand; il imitam ca sa nu
    // continue codul paginii dupa redirectionare
    redirect: vi.fn((url: string) => {
        throw new Error(`NEXT_REDIRECT:${url}`)
    }),
    notFound: vi.fn(),
}))

// Verifica faptul ca pagina s-a oprit printr-o redirectionare catre `to`.
async function expectRedirect(run: () => Promise<unknown>, to: string) {
    await expect(run()).rejects.toThrow(`NEXT_REDIRECT:${to}`)
    expect(redirect).toHaveBeenCalledWith(to)
}

vi.mock('@/helper/SupabaseClient', () => {
    const client = { from: vi.fn(), auth: { getUser: vi.fn() } }
    return { default: client, supabase: client }
})

vi.mock('@/backend/categories', () => ({ fetchAllResourcesWrapper: vi.fn(async () => []) }))
vi.mock('@/backend/user/getTests', () => ({ getTests: vi.fn() }))
vi.mock('@/backend/user/getDashboardData', () => ({ getDashboardData: vi.fn() }))
vi.mock('@/backend/user/profile/updateProfile', () => ({ updateProfile: vi.fn() }))
vi.mock('@/backend/user/profile/profileActions', () => ({
    addObjective: vi.fn(),
    deleteObjective: vi.fn(),
    toggleInterestTag: vi.fn(),
    toggleObjective: vi.fn(),
}))
vi.mock('@/backend/user/actions/getAssessmentAnalytics', () => ({
    getAssessmentAnalytics: vi.fn(async () => null),
    toggleResourceCompletion: vi.fn(),
}))
vi.mock('@/backend/user/submitAssessment', () => ({ submitAssessment: vi.fn() }))
vi.mock('@/backend/user/saveProgressAssessment', () => ({ saveSingleAnswer: vi.fn() }))
vi.mock('@/backend/user/generateAssessment', () => ({ generateAssessment: vi.fn() }))
vi.mock('@/backend/auth/logout', () => ({ default: vi.fn() }))

const USER = {
    id: 5,
    email: 'ana@test.com',
    name: 'Ana Pop',
    role: 'user',
    estimated_level: 'Intermediate',
}

function authAs(user: any) {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user } } as any)
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('pagini publice', () => {
    it('landing page prezinta produsul', () => {
        render(<Home />)

        expect(screen.getAllByText(/SkillPath/).length).toBeGreaterThan(0)
        expect(screen.getByText('Adaptive assessments')).toBeTruthy()
    })

    it('/login randeaza formularul de autentificare', () => {
        render(<LoginPage />)

        expect(screen.getByText('Welcome back')).toBeTruthy()
    })

    it('/signup randeaza formularul de inregistrare', () => {
        render(<SignupPage />)

        expect(screen.getByText('Sign up to continue your progress.')).toBeTruthy()
    })
})

describe('pagina /userDashboard', () => {
    function seedDashboard(overrides: Record<string, any> = {}) {
        vi.mocked(getTests).mockResolvedValue({
            succes: true,
            data: [
                {
                    id: 1,
                    categories: ['Frontend'],
                    questions: 10,
                    notAnswered: 3,
                    score: null,
                    status: 'in_progress',
                    startedAt: null,
                    completedAt: null,
                    progress: '30%',
                },
                {
                    id: 2,
                    categories: ['Backend'],
                    questions: 10,
                    notAnswered: 10,
                    score: 80,
                    status: 'completed',
                    startedAt: null,
                    completedAt: null,
                    progress: '100%',
                },
            ],
        } as any)
        vi.mocked(getDashboardData).mockResolvedValue({
            skills: [{ skill: 'Frontend', score: 80 }],
            scoreHistory: [{ month: 'Sep', score: 80 }],
            recentResults: [
                { id: 2, title: 'Backend', topic: 'Backend', difficulty: 'Medium', score: 80, date: 'Sep 1' },
            ],
            recommendedResources: [
                { id: 1, title: 'Node Guide', type: 'article', url: 'u', reason: 'Boost your weakest area' },
            ],
        })
        vi.mocked(fetchAllResourcesWrapper).mockResolvedValue([
            { id: 1, title: 'React Docs', url: 'https://react.dev', type: 'article', category: 'Frontend' },
        ])

        return mockFrom(supabase.from, {
            users: { data: USER, error: null },
            user_objectives: { data: [{ id: 1, title: 'Invat React', is_completed: false }], error: null },
            user_interests: { data: [{ category_id: 1 }], error: null },
            categories: { data: [{ id: 1, name: 'Frontend' }], error: null },
            assessments: { data: [{ id: 1 }, { id: 2 }], error: null },
            assessment_answers: { data: [{ id: 1 }, { id: 2 }, { id: 3 }], error: null },
            ...overrides,
        })
    }

    it('redirectioneaza vizitatorii neautentificati', async () => {
        authAs(null)

        await expectRedirect(UserDashboardPage, '/')
    })

    it('redirectioneaza adminii spre pagina publica', async () => {
        authAs({ id: 'auth-1' })
        seedDashboard({ users: { data: { ...USER, role: 'admin' }, error: null } })

        await expectRedirect(UserDashboardPage, '/')
    })

    it('randeaza dashboard-ul cu datele userului', async () => {
        authAs({ id: 'auth-1' })
        seedDashboard()

        render(await UserDashboardPage())

        expect(screen.getByText('Welcome back, Ana')).toBeTruthy()
        // un test finalizat, 3 raspunsuri corecte
        expect(screen.getByText('1')).toBeTruthy()
        expect(screen.getByText('3')).toBeTruthy()
        expect(screen.getByText('Invat React')).toBeTruthy()
        // testul in desfasurare apare in cardul de continuare
        expect(screen.getByText('30%')).toBeTruthy()
    })

    it('permite navigarea intre vizualizari', async () => {
        authAs({ id: 'auth-1' })
        seedDashboard()

        render(await UserDashboardPage())

        fireEvent.click(screen.getByRole('button', { name: 'Tests' }))
        expect(screen.getByRole('heading', { name: 'Tests' })).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Resources' }))
        expect(screen.getByRole('heading', { name: 'Resources' })).toBeTruthy()
        expect(screen.getByText('React Docs')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Profile' }))
        expect(screen.getByRole('heading', { name: 'Profile' })).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Results' }))
        expect(screen.getByText('Loading analytics...')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }))
        expect(screen.getByText('Welcome back, Ana')).toBeTruthy()
    })

    it('trece prin butoanele din antet catre teste si rezultate', async () => {
        authAs({ id: 'auth-1' })
        seedDashboard()

        render(await UserDashboardPage())

        fireEvent.click(screen.getByRole('button', { name: /Start a test/ }))
        expect(screen.getByRole('heading', { name: 'Tests' })).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }))
        fireEvent.click(screen.getByRole('button', { name: 'View progress' }))
        expect(screen.getByText('Loading analytics...')).toBeTruthy()
    })

    it('logheaza erorile de la interogarile secundare', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        authAs({ id: 'auth-1' })
        seedDashboard({
            assessments: { data: null, error: { message: 'assessments down' } },
            assessment_answers: { data: null, error: { message: 'answers down' } },
        })

        render(await UserDashboardPage())

        expect(consoleSpy).toHaveBeenCalledWith('Error fetching assessments:', 'assessments down')
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching correct answers:', 'answers down')
        consoleSpy.mockRestore()
    })
})

describe('pagina /profile', () => {
    it('redirectioneaza vizitatorii neautentificati', async () => {
        authAs(null)
        mockFrom(supabase.from, { users: { data: null, error: null } })

        await expectRedirect(ProfilePage, '/')
    })

    it('anunta cand profilul nu exista in baza de date', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, { users: { data: null, error: null } })

        render(await ProfilePage())

        expect(screen.getByText('User not found!')).toBeTruthy()
    })

    it('randeaza profilul cu obiective si interese', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, {
            users: { data: USER, error: null },
            user_objectives: { data: [{ id: 1, title: 'Invat React', is_completed: true }], error: null },
            user_interests: { data: [{ category_id: 1 }], error: null },
            categories: { data: [{ id: 1, name: 'Frontend' }], error: null },
        })

        render(await ProfilePage())

        expect(screen.getByRole('heading', { name: 'Profile' })).toBeTruthy()
        expect(screen.getByText('Invat React')).toBeTruthy()
        expect(screen.getByText('1 / 5 selected')).toBeTruthy()
    })

    it('trateaza listele lipsa', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, {
            users: { data: USER, error: null },
            user_objectives: { data: null, error: null },
            user_interests: { data: null, error: null },
            categories: { data: null, error: null },
        })

        render(await ProfilePage())

        expect(screen.getByText('No objectives added yet.')).toBeTruthy()
    })
})

describe('pagina /assessment/new', () => {
    it('redirectioneaza vizitatorii neautentificati', async () => {
        authAs(null)
        mockFrom(supabase.from, { users: { data: null, error: null } })

        await expectRedirect(NewTestPage, '/')
    })

    it('redirectioneaza cand userul nu exista in baza de date', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, { users: { data: null, error: null }, categories: { data: [], error: null } })

        await expectRedirect(NewTestPage, '/')
    })

    it('afiseaza doar categoriile de nivelul userului', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, {
            users: { data: { id: 5, estimated_level: 'Intermediate' }, error: null },
            categories: {
                data: [
                    { id: 1, name: 'Frontend', difficulty: 'Intermediate' },
                    { id: 2, name: 'Backend', difficulty: 'Advanced' },
                    { id: 3, name: 'Fara nivel', difficulty: null },
                ],
                error: null,
            },
        })

        render(await NewTestPage())

        expect(screen.getByRole('button', { name: 'Frontend' })).toBeTruthy()
        expect(screen.queryByRole('button', { name: 'Backend' })).toBeNull()
        expect(screen.getByText('Intermediate')).toBeTruthy()
    })

    it('trateaza userii fara nivel setat', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, {
            users: { data: { id: 5, estimated_level: null }, error: null },
            categories: { data: null, error: null },
        })

        render(await NewTestPage())

        expect(screen.getByText('Beginner')).toBeTruthy()
        expect(screen.getByText(/Nu exista categorii/)).toBeTruthy()
    })
})

describe('pagina /assessment/[id]', () => {
    const params = Promise.resolve({ id: '77' })

    it('redirectioneaza vizitatorii neautentificati', async () => {
        authAs(null)
        mockFrom(supabase.from, { users: { data: null, error: null } })

        await expectRedirect(() => AssessmentPage({ params: Promise.resolve({ id: '77' }) }), '/')
    })

    it('redirectioneaza cand testul apartine altui user', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, {
            users: { data: { id: 5 }, error: null },
            assessments: { data: { id: 77, user_id: 9, status: 'in_progress' }, error: null },
            assessment_answers: { data: [], error: null },
        })

        await expectRedirect(
            () => AssessmentPage({ params: Promise.resolve({ id: '77' }) }),
            '/userDashboard'
        )
    })

    it('redirectioneaza cand testul este deja finalizat', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, {
            users: { data: { id: 5 }, error: null },
            assessments: { data: { id: 77, user_id: 5, status: 'completed' }, error: null },
            assessment_answers: { data: [], error: null },
        })

        await expectRedirect(
            () => AssessmentPage({ params: Promise.resolve({ id: '77' }) }),
            '/userDashboard'
        )
    })

    it('randeaza intrebarile testului in desfasurare', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, {
            users: { data: { id: 5 }, error: null },
            assessments: { data: { id: 77, user_id: 5, status: 'in_progress' }, error: null },
            assessment_answers: {
                data: [
                    {
                        question_id: 1,
                        selected_option_id: null,
                        questions: {
                            question_text: 'Ce este JSX?',
                            difficulty: 'EASY',
                            options: [{ id: 'a', text: 'Sintaxa' }],
                        },
                    },
                    // rand fara intrebare asociata -> valori implicite
                    { question_id: 2, selected_option_id: 'b', questions: null },
                ],
                error: null,
            },
        })

        render(await AssessmentPage({ params }))

        expect(screen.getByText('1. Ce este JSX?')).toBeTruthy()
        expect(screen.getByText('Sintaxa')).toBeTruthy()
        expect(screen.getByText('2 întrebări · răspunde la toate.')).toBeTruthy()
    })
})

describe('pagina /assessment/[id]/completed', () => {
    it('redirectioneaza vizitatorii neautentificati', async () => {
        authAs(null)
        mockFrom(supabase.from, { users: { data: null, error: null } })

        await expectRedirect(
            () => AssessmentResultsPage({ params: Promise.resolve({ id: '77' }) }),
            '/'
        )
    })

    it('redirectioneaza cand testul nu este finalizat', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, {
            users: { data: { id: 5 }, error: null },
            assessments: { data: { id: 77, user_id: 5, status: 'in_progress' }, error: null },
            assessment_answers: { data: [], error: null },
        })

        await expectRedirect(
            () => AssessmentResultsPage({ params: Promise.resolve({ id: '77' }) }),
            '/assessment/77'
        )
    })

    it('afiseaza rezultatele testului finalizat', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, {
            users: { data: { id: 5 }, error: null },
            assessments: {
                data: {
                    id: 77,
                    user_id: 5,
                    status: 'completed',
                    score_total: 50,
                    started_at: '1 Sep 2026',
                },
                error: null,
            },
            assessment_answers: {
                data: [
                    {
                        question_id: 1,
                        selected_option_id: 'a',
                        is_correct: true,
                        questions: {
                            question_text: 'Ce este JSX?',
                            difficulty: 'EASY',
                            options: [{ id: 'a', text: 'Sintaxa' }],
                            correct_answer: 'a',
                            categories: { name: 'Frontend' },
                        },
                    },
                ],
                error: null,
            },
        })

        render(await AssessmentResultsPage({ params: Promise.resolve({ id: '77' }) }))

        expect(screen.getByText('50%')).toBeTruthy()
        expect(screen.getByText('Frontend')).toBeTruthy()
        expect(screen.getByText('Started: 1 Sep 2026')).toBeTruthy()
    })

    it('foloseste categoria implicita cand testul nu are raspunsuri', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, {
            users: { data: { id: 5 }, error: null },
            assessments: {
                data: { id: 77, user_id: 5, status: 'completed', score_total: null, started_at: 'azi' },
                error: null,
            },
            assessment_answers: { data: null, error: null },
        })

        render(await AssessmentResultsPage({ params: Promise.resolve({ id: '77' }) }))

        expect(screen.getByText('General')).toBeTruthy()
        expect(screen.getByText('0%')).toBeTruthy()
    })
})
