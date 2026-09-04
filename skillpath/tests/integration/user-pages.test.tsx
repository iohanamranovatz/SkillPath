import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { redirect } from 'next/navigation'
import { createClient } from '@/helper/supabase/server'
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
import { getTests, getCompletedTests } from '@/backend/user/getTests'
import { getDashboardData } from '@/backend/user/getDashboardData'

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
    usePathname: () => '/userDashboard',
    useSearchParams: () => new URLSearchParams(),
    // in Next.js redirect() stops execution by throwing; we mimic that so the
    // page code does not continue after the redirect
    redirect: vi.fn((url: string) => {
        throw new Error(`NEXT_REDIRECT:${url}`)
    }),
    notFound: vi.fn(),
}))

// Checks that the page stopped through a redirect to `to`.
async function expectRedirect(run: () => Promise<unknown>, to: string) {
    await expect(run()).rejects.toThrow(`NEXT_REDIRECT:${to}`)
    expect(redirect).toHaveBeenCalledWith(to)
}

vi.mock('@/helper/supabase/server', () => {
    const client = { from: vi.fn(), auth: { getUser: vi.fn() } }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
vi.mock('@/backend/categories', () => ({ fetchAllResourcesWrapper: vi.fn(async () => []) }))
vi.mock('@/backend/user/getTests', () => ({ getTests: vi.fn(), getCompletedTests: vi.fn() }))
// The onboarding gate is exercised in its own suite; here it is always satisfied
// so the pages under test render their normal content.
vi.mock('@/backend/user/assessments/initial/initialAssessmentLifecycle', () => ({
    INITIAL_ASSESSMENT_QUESTION_COUNT: 30,
    isInitialAssessment: vi.fn(async () => false),
    getInitialAssessmentOnboardingState: vi.fn(async () => ({
        requiresInitialAssessment: false,
        activeInitialAssessmentId: null,
        completedInitialAssessmentId: null,
    })),
}))
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

describe('public pages', () => {
    it('the landing page presents the product', () => {
        render(<Home />)

        expect(screen.getAllByText(/SkillPath/).length).toBeGreaterThan(0)
        expect(screen.getByText('Adaptive assessments')).toBeTruthy()
    })

    it('/login renders the login form', () => {
        render(<LoginPage />)

        expect(screen.getByText('Welcome back')).toBeTruthy()
    })

    it('/signup renders the sign up form', () => {
        render(<SignupPage />)

        expect(screen.getByText('Sign up to continue your progress.')).toBeTruthy()
    })
})

describe('/userDashboard page', () => {
    function seedDashboard(overrides: Record<string, any> = {}) {
        vi.mocked(getCompletedTests).mockResolvedValue({
            success: true,
            hasInitial: false,
            message: '',
            data: [{ id: 2, status: 'completed' }],
        } as any)
        vi.mocked(getTests).mockResolvedValue({
            success: true,
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

    it('redirects unauthenticated visitors', async () => {
        authAs(null)

        await expectRedirect(UserDashboardPage, '/')
    })

    it('redirects admins to the public page', async () => {
        authAs({ id: 'auth-1' })
        seedDashboard({ users: { data: { ...USER, role: 'admin' }, error: null } })

        await expectRedirect(UserDashboardPage, '/')
    })

    it('renders the dashboard with the user data', async () => {
        authAs({ id: 'auth-1' })
        seedDashboard()

        render(await UserDashboardPage())

        expect(screen.getByText('Welcome back, Ana')).toBeTruthy()
        // one completed test, 3 correct answers
        expect(screen.getByText('1')).toBeTruthy()
        expect(screen.getByText('3')).toBeTruthy()
        expect(screen.getByText('Invat React')).toBeTruthy()
        // the test in progress shows up in the continue card
        expect(screen.getByText('30%')).toBeTruthy()
    })

    it('allows navigating between views', async () => {
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

    it('goes through the header buttons to tests and results', async () => {
        authAs({ id: 'auth-1' })
        seedDashboard()

        render(await UserDashboardPage())

        fireEvent.click(screen.getByRole('button', { name: /Start a test/ }))
        expect(screen.getByRole('heading', { name: 'Tests' })).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }))
        fireEvent.click(screen.getByRole('button', { name: 'View progress' }))
        expect(screen.getByText('Loading analytics...')).toBeTruthy()
    })

    it('logs the errors from the secondary queries', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        authAs({ id: 'auth-1' })
        seedDashboard({
            assessment_answers: { data: null, error: { message: 'answers down' } },
        })
        // the completed tests come from getCompletedTests(), not from a direct query
        vi.mocked(getCompletedTests).mockResolvedValue({
            success: false,
            message: 'assessments down',
            data: [],
        } as any)

        render(await UserDashboardPage())

        expect(consoleSpy).toHaveBeenCalledWith('Error fetching assessments:', 'assessments down')
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching correct answers:', 'answers down')
        consoleSpy.mockRestore()
    })
})

describe('/profile page', () => {
    it('redirects unauthenticated visitors', async () => {
        authAs(null)
        mockFrom(supabase.from, { users: { data: null, error: null } })

        await expectRedirect(ProfilePage, '/')
    })

    it('announces when the profile does not exist in the database', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, { users: { data: null, error: null } })

        render(await ProfilePage())

        expect(screen.getByText('User not found!')).toBeTruthy()
    })

    it('renders the profile with objectives and interests', async () => {
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

    it('handles the missing lists', async () => {
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

describe('/assessment/new page', () => {
    it('redirects unauthenticated visitors', async () => {
        authAs(null)
        mockFrom(supabase.from, { users: { data: null, error: null } })

        await expectRedirect(NewTestPage, '/')
    })

    it('redirects when the user does not exist in the database', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, { users: { data: null, error: null }, categories: { data: [], error: null } })

        await expectRedirect(NewTestPage, '/')
    })

    it('shows only the categories matching the user level', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, {
            users: { data: { id: 5, estimated_level: 'Intermediate' }, error: null },
            categories: {
                data: [
                    { id: 1, name: 'Frontend', difficulty: 'Intermediate' },
                    { id: 2, name: 'Backend', difficulty: 'Advanced' },
                    { id: 3, name: 'No level', difficulty: null },
                ],
                error: null,
            },
        })

        render(await NewTestPage())

        expect(screen.getByRole('button', { name: 'Frontend' })).toBeTruthy()
        expect(screen.queryByRole('button', { name: 'Backend' })).toBeNull()
        expect(screen.getByText('Intermediate')).toBeTruthy()
    })

    it('handles users without a level set', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, {
            users: { data: { id: 5, estimated_level: null }, error: null },
            categories: { data: null, error: null },
        })

        render(await NewTestPage())

        expect(screen.getByText('Beginner')).toBeTruthy()
        expect(screen.getByText(/no categories for your level/i)).toBeTruthy()
    })
})

describe('/assessment/[id] page', () => {
    const params = Promise.resolve({ id: '77' })

    it('redirects unauthenticated visitors', async () => {
        authAs(null)
        mockFrom(supabase.from, { users: { data: null, error: null } })

        await expectRedirect(() => AssessmentPage({ params: Promise.resolve({ id: '77' }) }), '/')
    })

    it('redirects when the test belongs to another user', async () => {
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

    it('redirects when the test is already completed', async () => {
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

    it('renders the questions of the test in progress', async () => {
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
        expect(screen.getByText('2 questions · answer them all.')).toBeTruthy()
    })
})

describe('/assessment/[id]/completed page', () => {
    it('redirects unauthenticated visitors', async () => {
        authAs(null)
        mockFrom(supabase.from, { users: { data: null, error: null } })

        await expectRedirect(
            () => AssessmentResultsPage({ params: Promise.resolve({ id: '77' }) }),
            '/'
        )
    })

    it('redirects when the test is not completed', async () => {
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

    it('shows the results of the completed test', async () => {
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

    it('uses the default category when the test has no answers', async () => {
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
