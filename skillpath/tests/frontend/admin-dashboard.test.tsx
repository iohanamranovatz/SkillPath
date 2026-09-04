import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import Dashboard from '@/frontend/admin/components/Dashboard'
import { StatCard } from '@/frontend/admin/components/statCard'
import { AssessmentActivityCard } from '@/frontend/admin/components/activityCard'
import { MostProlificUsersCard } from '@/frontend/admin/components/remarkableUsers'
import { WeakestCategoriesCard } from '@/frontend/admin/components/weakCategories'
import { Logo } from '@/frontend/admin/components/logo'
import AdminFooter from '@/frontend/admin/components/Footer'
import AdminHeader from '@/frontend/admin/components/Header'
import AdminSidebar from '@/frontend/admin/components/Sidebar'
import UserTable from '@/frontend/admin/ManageUsers/table'
import UserToolbar from '@/frontend/admin/ManageUsers/toolbar'
import AddUserModal from '@/frontend/admin/ManageUsers/AddUserModal'
import { FilterSelect } from '@/frontend/admin/Questions/filter'
import { CategoryCard } from '@/frontend/admin/Categories/card'
import signOut from '@/backend/auth/logout'
import { AddUser } from '@/backend/admin/addUser'

const nav = vi.hoisted(() => ({
    pathname: '/adminDashboard',
    router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
}))

vi.mock('next/navigation', () => ({
    useRouter: () => nav.router,
    usePathname: () => nav.pathname,
    useSearchParams: () => new URLSearchParams(),
    redirect: vi.fn(),
    notFound: vi.fn(),
}))

vi.mock('@/backend/auth/logout', () => ({ default: vi.fn() }))
vi.mock('@/backend/admin/addUser', () => ({ AddUser: vi.fn() }))

beforeEach(() => {
    vi.clearAllMocks()
    nav.pathname = '/adminDashboard'
})

const dashboardProps = {
    stats: [
        { title: 'Total Students', value: 12, change: '5 active' },
        { title: 'Assessments', value: 30, change: '+4 this week' },
    ],
    assessmentActivity: [
        { day: 'Mon', fullDay: 'Monday', count: 2 },
        { day: 'Tue', fullDay: 'Tuesday', count: 0 },
    ],
    topUsers: [
        { id: '1', name: 'Ana', email: 'ana@test.com', count: 5, rank: 1 },
        { id: '2', name: 'Bogdan', email: 'bogdan@test.com', count: 3, rank: 2 },
    ],
    weakestCategories: [
        { id: '1', label: 'Backend', percentage: 80 },
        { id: '2', label: 'Frontend', percentage: 40 },
        { id: '3', label: 'Databases', percentage: 10 },
    ],
}

describe('Dashboard admin', () => {
    it('randeaza cardurile, activitatea, topul si categoriile slabe', () => {
        render(<Dashboard {...dashboardProps} />)

        expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
        expect(screen.getByText('Total Students')).toBeTruthy()
        expect(screen.getByText('Assessment Activity')).toBeTruthy()
        expect(screen.getByText('Most Prolific Users')).toBeTruthy()
        expect(screen.getByText('Weakest Categories')).toBeTruthy()
    })

    it('StatCard afiseaza titlul, valoarea si variatia', () => {
        render(<StatCard title="Questions" value={42} change="30 active" />)

        expect(screen.getByText('Questions')).toBeTruthy()
        expect(screen.getByText('42')).toBeTruthy()
        expect(screen.getByText('30 active')).toBeTruthy()
    })

    it('AssessmentActivityCard scaleaza barele la valoarea maxima', () => {
        const { container } = render(
            <AssessmentActivityCard items={dashboardProps.assessmentActivity} />
        )
        const bars = container.querySelectorAll('.bg-primary')

        expect(bars[0].getAttribute('style')).toContain('height: 100%')
        expect(bars[1].getAttribute('style')).toContain('height: 0%')
    })

    it('AssessmentActivityCard trateaza saptamana fara activitate', () => {
        const { container } = render(
            <AssessmentActivityCard items={[{ day: 'Mon', fullDay: 'Monday', count: 0 }]} />
        )

        expect(container.querySelector('.bg-primary')!.getAttribute('style')).toContain('height: 0%')
    })

    it('MostProlificUsersCard afiseaza randurile cu rang si initiala', () => {
        render(<MostProlificUsersCard users={dashboardProps.topUsers} />)

        expect(screen.getByText('ana@test.com')).toBeTruthy()
        expect(screen.getByText('5 completed')).toBeTruthy()
        expect(screen.getByText('A')).toBeTruthy()
    })

    it('MostProlificUsersCard randeaza tabelul gol', () => {
        render(<MostProlificUsersCard users={[]} />)

        expect(screen.getByText('Most Prolific Users')).toBeTruthy()
    })

    it.each([
        [80, 'bg-destructive'],
        [40, 'bg-chart-4'],
        [10, 'bg-chart-3'],
    ])('WeakestCategoriesCard coloreaza %i%% dupa severitate', (percentage, expectedClass) => {
        const { container } = render(
            <WeakestCategoriesCard categories={[{ id: '1', label: 'Test', percentage }]} />
        )

        expect(container.innerHTML).toContain(expectedClass)
    })

    it('Logo foloseste eticheta implicita si una personalizata', () => {
        const { rerender } = render(<Logo />)
        expect(screen.getByText('SkillPath')).toBeTruthy()

        rerender(<Logo label="Admin" className="extra" />)
        expect(screen.getByText('Admin')).toBeTruthy()
    })

    it('AdminFooter afiseaza versiunea', () => {
        render(<AdminFooter />)

        expect(screen.getByText('System Version 1.0.0')).toBeTruthy()
    })
})

describe('AdminHeader', () => {
    it('deschide meniul si face sign out', () => {
        render(<AdminHeader />)

        expect(screen.queryByText('Sign out')).toBeNull()

        fireEvent.click(screen.getByRole('button', { name: /Administrator/ }))
        fireEvent.click(screen.getByText('Sign out'))

        expect(signOut).toHaveBeenCalled()
        expect(screen.queryByText('Sign out')).toBeNull()
    })

    it('inchide meniul la click in afara', () => {
        render(<AdminHeader />)

        fireEvent.click(screen.getByRole('button', { name: /Administrator/ }))
        expect(screen.getByText('Sign out')).toBeTruthy()

        fireEvent.mouseDown(document.body)

        expect(screen.queryByText('Sign out')).toBeNull()
    })
})

describe('AdminSidebar', () => {
    it('marcheaza ruta curenta ca activa', () => {
        nav.pathname = '/questions'
        render(<AdminSidebar />)

        expect(screen.getByRole('link', { name: /Question bank/ }).getAttribute('aria-current')).toBe('page')
        expect(screen.getByRole('link', { name: /Dashboard/ }).getAttribute('aria-current')).toBeNull()
    })

    it('ascunde etichetele cand este pliat', () => {
        render(<AdminSidebar />)

        expect(screen.getByText('Manage users')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }))

        expect(screen.queryByText('Manage users')).toBeNull()
        expect(screen.queryByText('SkillPath')).toBeNull()
    })
})

describe('UserTable', () => {
    const users = [
        { id: 1, name: 'Ana', email: 'ana@test.com', role: 'user', estimated_level: 'Beginner', assessments: [{}, {}] },
        { id: 2, name: 'Bogdan', email: 'b@test.com', role: 'admin', estimated_level: 'Advanced' },
        { id: 3, name: 'Cristi', email: 'c@test.com', role: 'user', estimated_level: 'Intermediate' },
        { id: 4, name: 'Dana', email: 'd@test.com', role: 'user', estimated_level: 'Necunoscut' },
    ] as any[]

    it('afiseaza mesajul gol cand nu exista utilizatori', () => {
        render(<UserTable users={[]} />)

        expect(screen.getByText('No users found.')).toBeTruthy()
    })

    it('afiseaza datele fiecarui utilizator', () => {
        render(<UserTable users={users} />)

        expect(screen.getByText('ana@test.com')).toBeTruthy()
        expect(screen.getByText('2 completed')).toBeTruthy()
        expect(screen.getAllByText('0 completed')).toHaveLength(3)
        expect(screen.getByRole('link', { name: 'Ana' }).getAttribute('href')).toBe('/manageUsers/1')
    })

    it('schimba rolul doar dupa confirmare', async () => {
        const onRoleChange = vi.fn()
        render(<UserTable users={users} onRoleChange={onRoleChange} />)

        const selects = screen.getAllByRole('combobox')

        // schimbarea din dropdown doar deschide dialogul
        fireEvent.change(selects[0], { target: { value: 'admin' } })
        expect(screen.getByText('Change role?')).toBeTruthy()
        expect(onRoleChange).not.toHaveBeenCalled()

        // Cancel inchide dialogul fara sa schimbe nimic
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
        await waitFor(() => expect(screen.queryByText('Change role?')).toBeNull())
        expect(onRoleChange).not.toHaveBeenCalled()

        fireEvent.change(selects[0], { target: { value: 'admin' } })
        fireEvent.click(screen.getByRole('button', { name: 'Change role' }))
        await waitFor(() => expect(onRoleChange).toHaveBeenCalledWith(1, 'admin'))
    })

    it('sterge utilizatorul doar dupa confirmare', async () => {
        const onDelete = vi.fn()
        render(<UserTable users={users} onDelete={onDelete} />)

        fireEvent.click(screen.getByRole('button', { name: 'Delete user 2' }))
        expect(screen.getByText('Delete user?')).toBeTruthy()
        expect(onDelete).not.toHaveBeenCalled()

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
        await waitFor(() => expect(onDelete).toHaveBeenCalledWith(2))
    })
})

describe('UserToolbar si FilterSelect', () => {
    it('transmite cautarea si nivelul selectat', () => {
        const onSearchChange = vi.fn()
        const onLevelChange = vi.fn()
        render(
            <UserToolbar
                searchTerm=""
                onSearchChange={onSearchChange}
                level="all"
                onLevelChange={onLevelChange}
            />
        )

        fireEvent.change(screen.getByPlaceholderText('Search users...'), {
            target: { value: 'ana' },
        })
        expect(onSearchChange).toHaveBeenCalledWith('ana')

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Advanced' } })
        expect(onLevelChange).toHaveBeenCalledWith('Advanced')
    })

    it('FilterSelect afiseaza placeholder-ul si optiunile', () => {
        render(
            <FilterSelect
                value=""
                onChange={vi.fn()}
                options={[{ label: 'Easy', value: 'EASY' }]}
                placeholder="Alege"
            />
        )

        expect(screen.getByText('Alege')).toBeTruthy()
        expect(screen.getByText('Easy')).toBeTruthy()
    })
})

describe('AddUserModal', () => {
    function fillForm() {
        fireEvent.change(screen.getByPlaceholderText('e.g. John Doe'), { target: { value: 'Ana' } })
        fireEvent.change(screen.getByPlaceholderText('alex.doe@example.com'), {
            target: { value: 'ana@test.com' },
        })
    }

    it('nu randeaza nimic cand este inchis', () => {
        const { container } = render(
            <AddUserModal isOpen={false} onClose={vi.fn()} onUserAdded={vi.fn()} />
        )

        expect(container.firstChild).toBeNull()
    })

    it('trimite formularul si notifica parintele', async () => {
        const onClose = vi.fn()
        const onUserAdded = vi.fn()
        vi.mocked(AddUser).mockResolvedValue({ success: true, user: { id: 9, name: 'Ana' } } as any)
        render(<AddUserModal isOpen onClose={onClose} onUserAdded={onUserAdded} />)

        fillForm()
        fireEvent.submit(screen.getByRole('button', { name: 'Save User' }).closest('form')!)

        await waitFor(() => expect(onUserAdded).toHaveBeenCalledWith({ id: 9, name: 'Ana' }))
        expect(onClose).toHaveBeenCalled()
    })

    it('afiseaza eroarea returnata de server', async () => {
        vi.mocked(AddUser).mockResolvedValue({ success: false, message: 'All fields are required.' } as any)
        render(<AddUserModal isOpen onClose={vi.fn()} onUserAdded={vi.fn()} />)

        fillForm()
        fireEvent.submit(screen.getByRole('button', { name: 'Save User' }).closest('form')!)

        expect(await screen.findByText('Error: All fields are required.')).toBeTruthy()
    })

    it('se inchide de la butonul Cancel', () => {
        const onClose = vi.fn()
        render(<AddUserModal isOpen onClose={onClose} onUserAdded={vi.fn()} />)

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(onClose).toHaveBeenCalled()
    })
})

describe('CategoryCard', () => {
    it('afiseaza initialele, tagul si numarul de exercitii', () => {
        const onClick = vi.fn()
        render(
            <CategoryCard
                category={{ id: '1', name: 'Frontend Development', exerciseCount: 12, tags: 'React' }}
                onClick={onClick}
            />
        )

        expect(screen.getByText('Fron')).toBeTruthy()
        expect(screen.getByText('React')).toBeTruthy()
        expect(screen.getByText('12 exercises')).toBeTruthy()

        fireEvent.click(screen.getByRole('button'))
        expect(onClick).toHaveBeenCalled()
    })

    it('ascunde pilula de tag cand lipseste', () => {
        render(
            <CategoryCard category={{ id: '2', name: 'Backend', exerciseCount: 0, tags: '' }} />
        )

        expect(screen.getByText('0 exercises')).toBeTruthy()
    })
})
