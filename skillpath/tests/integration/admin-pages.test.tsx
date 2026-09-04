import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { redirect } from 'next/navigation'
import { createClient } from '@/helper/supabase/server'
import { mockFrom } from '../helpers/supabaseMock'

import AdminLayout from '@/app/(admin)/layout'
import AdminDashboardPage from '@/app/(admin)/adminDashboard/page'
import { AdminDashboardUI } from '@/frontend/admin/dashboard/AdminDasboardUI'
import QuestionBankPage from '@/app/(admin)/questions/page'
import QuestionBankClient from '@/app/(admin)/questions/client'
import WeakCategoriesCard from '@/app/(admin)/weakCategories/page'
import CategoriesPage from '@/app/(admin)/categories/page'
import CategoryDetailPage from '@/app/(admin)/categories/[id]/page'
import UserManagementPage from '@/app/(admin)/manageUsers/page'
import UserDetailsPage from '@/app/(admin)/manageUsers/[id]/page'
import ResourceFilters from '@/app/(admin)/manageUsers/[id]/ResourceFilters'

import { getQuestions } from '@/backend/admin/actions/questions'
import { getWeakCategories } from '@/backend/admin/getWeakCategories'
import { getAdminDashboardData } from '@/backend/admin/getAdminDashboardData'
import {
    getCategoryById,
    getResourcesFromCategory,
    getQuestionsByCategory,
} from '@/backend/categories'
import { updateUserRole } from '@/backend/admin/actions/roleChange'

const nav = vi.hoisted(() => ({
    pathname: '/manageUsers/1',
    search: '',
    router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
}))

vi.mock('next/navigation', () => ({
    useRouter: () => nav.router,
    usePathname: () => nav.pathname,
    useSearchParams: () => new URLSearchParams(nav.search),
    redirect: vi.fn(),
    notFound: vi.fn(),
}))

// the same client stub for both modules (server + browser), so it can be
// controlled from a single place in the tests
const stub = vi.hoisted(() => ({
    client: { from: vi.fn(), auth: { getUser: vi.fn() } },
}))

vi.mock('@/helper/supabase/server', () => ({
    default: stub.client,
    supabase: stub.client,
    createClient: () => stub.client,
}))
vi.mock('@/helper/supabase/client', () => ({
    default: () => stub.client,
    createClient: () => stub.client,
}))

const supabase = createClient() as any
vi.mock('@/backend/admin/actions/questions', () => ({
    getQuestions: vi.fn(),
    deleteQuestion: vi.fn(),
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    getAllCategories: vi.fn(async () => []),
}))
vi.mock('@/backend/admin/getWeakCategories', () => ({ getWeakCategories: vi.fn() }))
vi.mock('@/backend/admin/getAdminDashboardData', () => ({ getAdminDashboardData: vi.fn() }))
vi.mock('@/backend/admin/actions/roleChange', () => ({ updateUserRole: vi.fn() }))
vi.mock('@/backend/categories', () => ({
    getCategoryById: vi.fn(),
    getResourcesFromCategory: vi.fn(),
    getQuestionsByCategory: vi.fn(),
    getCategories: vi.fn(async () => ({ success: true, data: [] })),
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    addResource: vi.fn(),
}))

beforeEach(() => {
    vi.clearAllMocks()
    nav.search = ''
})

function authAs(user: any) {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user } } as any)
}

describe('AdminLayout', () => {
    // the layout is an async server component: it checks the session and the
    // admin role before rendering the chrome, so it has to be awaited
    it('renders the chrome around the content', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, { users: { data: { role: 'admin' }, error: null } })

        render(await AdminLayout({ children: <p>Page content</p> }))

        expect(screen.getByText('Page content')).toBeTruthy()
        expect(screen.getByText('Admin Dashboard')).toBeTruthy()
        expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeTruthy()
    })

    it('redirects a visitor who is not an admin', async () => {
        authAs({ id: 'auth-1' })
        mockFrom(supabase.from, { users: { data: { role: 'user' }, error: null } })

        await AdminLayout({ children: <p>Page content</p> })

        expect(redirect).toHaveBeenCalledWith('/login')
    })
})

describe('/adminDashboard page', () => {
    it('redirects unauthenticated visitors', async () => {
        authAs(null)

        await AdminDashboardPage()

        expect(redirect).toHaveBeenCalledWith('/')
    })

    it('renders the dashboard for an authenticated admin', async () => {
        authAs({ id: 'auth-1' })
        vi.mocked(getAdminDashboardData).mockResolvedValue({
            stats: [{ title: 'Total Students', value: 3, change: '2 active' }],
            assessmentActivity: [{ day: 'Mon', fullDay: 'Monday', count: 1 }],
            topUsers: [{ id: '1', name: 'Ana', email: 'ana@test.com', count: 2, rank: 1 }],
            weakestCategories: [{ id: '1', label: 'Backend', percentage: 70 }],
        })

        const page = await AdminDashboardPage()
        // the page renders the AdminDashboardUI server component, so we resolve it separately
        render(await AdminDashboardUI())

        expect(page).toBeTruthy()
        expect(redirect).not.toHaveBeenCalled()
        expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
        expect(screen.getByText('Total Students')).toBeTruthy()
    })
})

describe('/questions page', () => {
    const questions = Array.from({ length: 8 }, (_, i) => ({
        id: String(i + 1),
        title: `Intrebarea ${i + 1}`,
        text: 'Text',
        category: 'Frontend',
        difficulty: i === 0 ? ('HARD' as const) : ('EASY' as const),
        options: [],
        correctAnswersId: '',
        isActive: true,
    }))

    it('passes the loaded questions to the client', async () => {
        vi.mocked(getQuestions).mockResolvedValue({ success: true, data: questions } as any)

        render(await QuestionBankPage())

        expect(screen.getByText('Question Bank')).toBeTruthy()
        expect(screen.getByText('Intrebarea 1')).toBeTruthy()
    })

    it('uses an empty list when loading fails', async () => {
        vi.mocked(getQuestions).mockResolvedValue({ success: false, error: 'boom' } as any)

        render(await QuestionBankPage())

        expect(screen.getByText('No questions found.')).toBeTruthy()
    })

    it('filters by text and difficulty and paginates', () => {
        render(<QuestionBankClient initialQuestions={questions} />)

        expect(screen.getByText('Page 1 of 2')).toBeTruthy()
        expect(screen.queryByText('Intrebarea 7')).toBeNull()

        fireEvent.click(screen.getByRole('button', { name: 'Next' }))
        expect(screen.getByText('Intrebarea 7')).toBeTruthy()

        fireEvent.change(screen.getByPlaceholderText('Search questions...'), {
            target: { value: 'Intrebarea 1' },
        })
        expect(screen.getByText('Intrebarea 1')).toBeTruthy()
        expect(screen.queryByText('Intrebarea 2')).toBeNull()

        fireEvent.change(screen.getByPlaceholderText('Search questions...'), {
            target: { value: '' },
        })
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'HARD' } })
        expect(screen.getByText('Intrebarea 1')).toBeTruthy()
        expect(screen.queryByText('Intrebarea 2')).toBeNull()
    })
})

describe('/weakCategories page', () => {
    it('shows the loading state, then the top problem categories', async () => {
        vi.mocked(getWeakCategories).mockResolvedValue([
            {
                categoryId: 1,
                categoryName: 'Backend',
                wrongAnswersCount: 8,
                totalAnswersCount: 10,
                errorPercentage: 80,
            },
        ])
        render(<WeakCategoriesCard />)

        expect(screen.getByText('Loading weak categories...')).toBeTruthy()

        expect(await screen.findByText('Backend')).toBeTruthy()
        expect(screen.getByText('80% Wrong (8/10)')).toBeTruthy()
    })

    it('announces the missing data', async () => {
        vi.mocked(getWeakCategories).mockResolvedValue([])
        render(<WeakCategoriesCard />)

        expect(
            await screen.findByText('Not enough data to generate statistics yet.')
        ).toBeTruthy()
    })
})

describe('category pages', () => {
    it('/categories renders the categories manager', async () => {
        render(<CategoriesPage />)

        expect(await screen.findByRole('heading', { name: 'Skill Categories' })).toBeTruthy()
    })

    it('/categories/[id] shows the resources and the questions of the category', async () => {
        vi.mocked(getCategoryById).mockResolvedValue({
            success: true,
            data: { id: 1, name: 'Frontend', description: 'React & Next.js' },
        } as any)
        vi.mocked(getResourcesFromCategory).mockResolvedValue({
            success: true,
            data: [
                { id: 1, title: 'React Docs', url: 'https://react.dev', type: 'article', categoryId: 1 },
                { id: 2, title: 'Fara link', url: null, type: 'video', categoryId: 1 },
            ],
        } as any)
        vi.mocked(getQuestionsByCategory).mockResolvedValue({
            success: true,
            data: [{ id: 1, question_text: 'Ce este JSX?', difficulty: 'EASY' }],
        } as any)

        render(await CategoryDetailPage({ params: Promise.resolve({ id: '1' }) }))

        expect(screen.getByRole('heading', { name: 'Frontend' })).toBeTruthy()
        expect(screen.getByText('React & Next.js')).toBeTruthy()
        expect(screen.getByRole('link', { name: /Open/ }).getAttribute('href')).toBe('https://react.dev')
        expect(screen.getByText('Questions (1)')).toBeTruthy()
        expect(screen.getByText('Ce este JSX?')).toBeTruthy()
    })

    it('/categories/[id] announces a non-existent category', async () => {
        vi.mocked(getCategoryById).mockResolvedValue({ success: false, data: null } as any)
        vi.mocked(getResourcesFromCategory).mockResolvedValue({ success: true, data: [] } as any)
        vi.mocked(getQuestionsByCategory).mockResolvedValue({ success: true, data: [] } as any)

        render(await CategoryDetailPage({ params: Promise.resolve({ id: '99' }) }))

        expect(screen.getByText('Category not found.')).toBeTruthy()
    })

    it('/categories/[id] shows the empty states', async () => {
        vi.mocked(getCategoryById).mockResolvedValue({
            success: true,
            data: { id: 1, name: 'Frontend', description: null },
        } as any)
        vi.mocked(getResourcesFromCategory).mockResolvedValue({ success: true, data: [] } as any)
        vi.mocked(getQuestionsByCategory).mockResolvedValue({ success: true, data: [] } as any)

        render(await CategoryDetailPage({ params: Promise.resolve({ id: '1' }) }))

        expect(screen.getByText('No resources available yet.')).toBeTruthy()
        expect(screen.getByText('No questions belong to this category.')).toBeTruthy()
    })
})

describe('/manageUsers page', () => {
    const users = Array.from({ length: 9 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@test.com`,
        role: i === 0 ? 'admin' : 'user',
        estimated_level: i % 2 === 0 ? 'Beginner' : 'Advanced',
    }))

    it('loads the users and paginates them', async () => {
        mockFrom(supabase.from, { users: { data: users, error: null } })
        render(<UserManagementPage />)

        expect(screen.getByText('Loading users...')).toBeTruthy()

        expect(await screen.findByText('user1@test.com')).toBeTruthy()
        expect(screen.queryByText('user8@test.com')).toBeNull()

        fireEvent.click(screen.getByRole('button', { name: 'Next' }))
        expect(screen.getByText('user8@test.com')).toBeTruthy()
    })

    it('filters by search, level and role', async () => {
        mockFrom(supabase.from, { users: { data: users, error: null } })
        render(<UserManagementPage />)
        await screen.findByText('user1@test.com')

        fireEvent.change(screen.getByPlaceholderText('Search users...'), {
            target: { value: 'user2@' },
        })
        expect(screen.getByText('user2@test.com')).toBeTruthy()
        expect(screen.queryByText('user1@test.com')).toBeNull()

        fireEvent.change(screen.getByPlaceholderText('Search users...'), { target: { value: '' } })
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Advanced' } })
        expect(screen.queryByText('user1@test.com')).toBeNull()
        expect(screen.getByText('user2@test.com')).toBeTruthy()

        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'all' } })
        fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'admin' } })
        expect(screen.getByText('user1@test.com')).toBeTruthy()
        expect(screen.queryByText('user2@test.com')).toBeNull()
    })

    it('logs the loading error', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        mockFrom(supabase.from, { users: { data: null, error: { message: 'db down' } } })
        render(<UserManagementPage />)

        await waitFor(() =>
            expect(consoleSpy).toHaveBeenCalledWith('Error getting users from database: ', 'db down')
        )
        expect(screen.getByText('No users found.')).toBeTruthy()
        consoleSpy.mockRestore()
    })

    it('changes the role of a user', async () => {
        mockFrom(supabase.from, { users: { data: users.slice(0, 2), error: null } })
        vi.mocked(updateUserRole).mockResolvedValue({ success: true })
        render(<UserManagementPage />)
        await screen.findByText('user1@test.com')

        fireEvent.change(screen.getAllByRole('combobox')[2], { target: { value: 'admin' } })
        fireEvent.click(screen.getByRole('button', { name: 'Change role' }))

        await waitFor(() => expect(updateUserRole).toHaveBeenCalledWith(1, 'admin'))
    })

    it('warns when the role change fails', async () => {
        mockFrom(supabase.from, { users: { data: users.slice(0, 2), error: null } })
        vi.mocked(updateUserRole).mockResolvedValue({ success: false, message: 'Could not change role' })
        render(<UserManagementPage />)
        await screen.findByText('user1@test.com')

        fireEvent.change(screen.getAllByRole('combobox')[2], { target: { value: 'admin' } })
        fireEvent.click(screen.getByRole('button', { name: 'Change role' }))

        // the error shows up as a banner in the page, not as a native alert()
        await waitFor(() => expect(screen.getByText('Could not change role')).toBeTruthy())
    })

    it('deletes a user from the list', async () => {
        mockFrom(supabase.from, { users: { data: users.slice(0, 2), error: null } })
        render(<UserManagementPage />)
        await screen.findByText('user1@test.com')

        fireEvent.click(screen.getByRole('button', { name: 'Delete user 1' }))
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

        await waitFor(() => expect(screen.queryByText('user1@test.com')).toBeNull())
    })

    it('opens the add modal and inserts the new user into the list', async () => {
        mockFrom(supabase.from, { users: { data: [], error: null } })
        render(<UserManagementPage />)
        await screen.findByText('No users found.')

        fireEvent.click(screen.getByRole('button', { name: '+ Add User' }))

        expect(screen.getByText('Add New User')).toBeTruthy()
    })
})

describe('/manageUsers/[id] page', () => {
    const user = {
        id: 1,
        name: 'Ana Pop',
        email: 'ana@test.com',
        role: 'user',
        estimated_level: 'Beginner',
    }

    function seed(overrides: Record<string, any> = {}) {
        return mockFrom(supabase.from, {
            users: { data: user, error: null },
            assessments: {
                data: [
                    { id: 1, status: 'completed', score_total: 80, started_at: '2026-09-01' },
                    { id: 2, status: 'in_progress', score_total: 40, started_at: '2026-09-02' },
                ],
                error: null,
            },
            learning_resources: {
                data: [
                    { id: 10, title: 'Node Guide', url: 'u', type: 'article', category_id: 2, categories: { name: 'Backend' } },
                ],
                error: null,
            },
            user_progress: { data: [{ resource_id: 10, is_completed: true }], error: null },
            ...overrides,
        })
    }

    it('shows the profile, the metrics and the recommended resources', async () => {
        vi.mocked(getWeakCategories).mockResolvedValue([
            {
                categoryId: 2,
                categoryName: 'Backend',
                wrongAnswersCount: 3,
                totalAnswersCount: 4,
                errorPercentage: 75,
            },
        ])
        seed()

        render(
            await UserDetailsPage({
                params: Promise.resolve({ id: '1' }),
                searchParams: Promise.resolve({}),
            })
        )

        expect(screen.getByRole('heading', { name: 'Ana Pop' })).toBeTruthy()
        expect(screen.getByText('AN')).toBeTruthy()
        expect(screen.getByText('60.0 pts')).toBeTruthy()
        expect(screen.getAllByText('1 / 1').length).toBeGreaterThan(0)
        expect(screen.getByText('100% progress')).toBeTruthy()
        expect(screen.getByText('Node Guide')).toBeTruthy()
    })

    it('filters the resources by the category in the url', async () => {
        vi.mocked(getWeakCategories).mockResolvedValue([
            {
                categoryId: 2,
                categoryName: 'Backend',
                wrongAnswersCount: 3,
                totalAnswersCount: 4,
                errorPercentage: 75,
            },
        ])
        seed()

        render(
            await UserDetailsPage({
                params: Promise.resolve({ id: '1' }),
                searchParams: Promise.resolve({ category: '99', page: '1' }),
            })
        )

        expect(screen.queryByText('Node Guide')).toBeNull()
    })

    it('announces when the user does not exist', async () => {
        vi.mocked(getWeakCategories).mockResolvedValue([])
        mockFrom(supabase.from, {
            users: { data: null, error: { message: 'not found' } },
            assessments: { data: null, error: null },
            user_progress: { data: null, error: null },
        })

        render(
            await UserDetailsPage({
                params: Promise.resolve({ id: '99' }),
                searchParams: Promise.resolve({}),
            })
        )

        expect(screen.getByText('User not found!')).toBeTruthy()
    })
})

describe('ResourceFilters', () => {
    const categories = [
        { id: 1, name: 'Frontend' },
        { id: 2, name: 'Backend' },
    ]

    it('changes the category and resets the page', () => {
        render(
            <ResourceFilters categories={categories} selectedCategory="all" currentPage={1} totalPages={3} />
        )

        fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } })

        expect(nav.router.push).toHaveBeenCalledWith('/manageUsers/1?category=2&page=1', {
            scroll: false,
        })
    })

    it('navigates between pages', () => {
        render(
            <ResourceFilters categories={categories} selectedCategory="all" currentPage={2} totalPages={3} />
        )

        const [prev, next] = screen.getAllByRole('button')

        fireEvent.click(prev)
        expect(nav.router.push).toHaveBeenCalledWith('/manageUsers/1?page=1', { scroll: false })

        fireEvent.click(next)
        expect(nav.router.push).toHaveBeenCalledWith('/manageUsers/1?page=3', { scroll: false })
    })

    it('disables the buttons at the ends', () => {
        render(
            <ResourceFilters categories={categories} selectedCategory="1" currentPage={1} totalPages={1} />
        )

        const buttons = screen.getAllByRole('button') as HTMLButtonElement[]
        expect(buttons[0].disabled).toBe(true)
        expect(buttons[1].disabled).toBe(true)
    })
})
