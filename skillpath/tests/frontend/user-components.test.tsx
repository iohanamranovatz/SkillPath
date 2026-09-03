import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'

import { DifficultyBadge } from '@/frontend/user/components/difficulty-badge'
import { PageHeading } from '@/frontend/user/components/page-heading'
import { GreetingHeader } from '@/frontend/user/components/greeting-header'
import { StatCards } from '@/frontend/user/components/stat-cards'
import { ContinueCard } from '@/frontend/user/components/continue-card'
import RecentResults from '@/frontend/user/components/recent-results'
import { RecommendedResources } from '@/frontend/user/components/recommended-resources'
import { ScoreChart } from '@/frontend/user/components/score-chart'
import { SkillRadar } from '@/frontend/user/components/skill-radar'
import { Sidebar } from '@/frontend/user/components/sidebar'
import { Topbar } from '@/frontend/user/components/topbar'
import Pagination from '@/frontend/components/pagination'
import { SearchBar } from '@/frontend/admin/Questions/search-bar'
import signOut from '@/backend/auth/logout'

vi.mock('@/backend/auth/logout', () => ({ default: vi.fn() }))

const router = (useRouter as any)()

beforeEach(() => {
    vi.clearAllMocks()
})

describe('DifficultyBadge', () => {
    it.each(['Easy', 'Medium', 'Hard'] as const)('afiseaza dificultatea %s', (difficulty) => {
        render(<DifficultyBadge difficulty={difficulty} />)

        expect(screen.getByText(difficulty)).toBeTruthy()
    })
})

describe('PageHeading', () => {
    it('afiseaza titlul, descrierea si actiunea optionala', () => {
        render(<PageHeading title="Tests" description="Descriere" action={<button>Nou</button>} />)

        expect(screen.getByRole('heading', { name: 'Tests' })).toBeTruthy()
        expect(screen.getByText('Descriere')).toBeTruthy()
        expect(screen.getByRole('button', { name: 'Nou' })).toBeTruthy()
    })

    it('functioneaza si fara actiune', () => {
        render(<PageHeading title="Results" description="Fara actiune" />)

        expect(screen.queryByRole('button')).toBeNull()
    })
})

describe('GreetingHeader', () => {
    it('saluta userul cu prenumele si afiseaza nivelul', () => {
        render(<GreetingHeader name="Ana Maria Pop" level="Intermediate" />)

        expect(screen.getByText('Welcome back, Ana')).toBeTruthy()
        expect(screen.getByText('Intermediate')).toBeTruthy()
    })

    it('apeleaza callback-urile primite pe cele doua butoane', () => {
        const viewProgress = vi.fn()
        const startTest = vi.fn()
        render(<GreetingHeader name="Ana" level="Beginner" onStart={[viewProgress, startTest]} />)

        fireEvent.click(screen.getByRole('button', { name: 'View progress' }))
        fireEvent.click(screen.getByRole('button', { name: /Start a test/ }))

        expect(viewProgress).toHaveBeenCalled()
        expect(startTest).toHaveBeenCalled()
    })
})

describe('StatCards', () => {
    it('afiseaza statisticile si primele trei obiective', () => {
        render(
            <StatCards
                testsCompleted={12}
                problemsSolved={140}
                objectives={[
                    { id: 1, title: 'Invat React', is_completed: true },
                    { id: 2, title: 'Invat SQL', is_completed: false },
                    { id: 3, title: 'Invat Docker', is_completed: false },
                    { id: 4, title: 'Al patrulea', is_completed: false },
                ]}
            />
        )

        expect(screen.getByText('12')).toBeTruthy()
        expect(screen.getByText('140')).toBeTruthy()
        expect(screen.getByText('Invat React')).toBeTruthy()
        expect(screen.queryByText('Al patrulea')).toBeNull()
    })

    it('afiseaza mesajul gol cand nu exista obiective', () => {
        render(<StatCards testsCompleted={0} problemsSolved={0} />)

        expect(screen.getByText('No objectives set right now.')).toBeTruthy()
    })
})

describe('ContinueCard', () => {
    const test = {
        id: 7,
        categories: ['Frontend'],
        questions: 10,
        score: null,
        status: 'in_progress',
        startedAt: null,
        completedAt: null,
        progress: '30%',
    }

    it('nu randeaza nimic fara test in desfasurare', () => {
        const { container } = render(<ContinueCard />)

        expect(container.firstChild).toBeNull()
    })

    it('afiseaza progresul si numarul de intrebari ramase', () => {
        render(<ContinueCard test={test} />)

        expect(screen.getByText('Frontend')).toBeTruthy()
        expect(screen.getByText('7 questions left')).toBeTruthy()
        expect(screen.getByText('30%')).toBeTruthy()
    })

    it('navigheaza la test la apasarea butonului Resume', () => {
        render(<ContinueCard test={test} />)

        fireEvent.click(screen.getByRole('button', { name: /Resume/ }))

        expect(router.push).toHaveBeenCalledWith('/assessment/7')
    })

    it('foloseste id-ul testului cand nu exista categorii', () => {
        render(<ContinueCard test={{ ...test, categories: [], progress: null }} />)

        expect(screen.getByText('Assessment #7')).toBeTruthy()
        expect(screen.getByText('0%')).toBeTruthy()
    })
})

describe('RecentResults', () => {
    it('afiseaza mesajul gol fara rezultate', () => {
        render(<RecentResults />)

        expect(screen.getByText(/No results yet/)).toBeTruthy()
    })

    it.each([
        [90, 'Excelent'],
        [75, 'Bun'],
        [40, 'Slab'],
    ])('coloreaza scorul de %i%%', (score, title) => {
        render(
            <RecentResults
                results={[
                    { id: 1, title, topic: 'Frontend', difficulty: 'Easy', score, date: 'Sep 1' },
                ]}
            />
        )

        expect(screen.getByText(title)).toBeTruthy()
        expect(screen.getByText(`${score}%`)).toBeTruthy()
    })
})

describe('RecommendedResources', () => {
    it('afiseaza mesajul gol fara recomandari', () => {
        render(<RecommendedResources />)

        expect(screen.getByText(/No recommendations yet/)).toBeTruthy()
    })

    it.each(['article', 'video', 'exercise', 'course', 'necunoscut', ''])(
        'randeaza resursa de tip "%s"',
        (type) => {
            render(
                <RecommendedResources
                    resources={[
                        { id: 1, title: 'Ghid', type, url: 'https://x.dev', reason: 'Zona slaba' },
                    ]}
                />
            )

            const link = screen.getByRole('link', { name: /Ghid/ })
            expect(link.getAttribute('href')).toBe('https://x.dev')
        }
    )

    it('scrie tipul cu prima litera mare', () => {
        render(
            <RecommendedResources
                resources={[{ id: 1, title: 'Ghid', type: 'VIDEO', url: 'u', reason: 'r' }]}
            />
        )

        expect(screen.getByText('Video')).toBeTruthy()
    })

    it('afiseaza "Resource" cand tipul lipseste', () => {
        render(
            <RecommendedResources
                resources={[{ id: 1, title: 'Ghid', type: '', url: 'u', reason: 'r' }]}
            />
        )

        expect(screen.getByText('Resource')).toBeTruthy()
    })
})

describe('ScoreChart si SkillRadar', () => {
    it('ScoreChart afiseaza starea goala', () => {
        render(<ScoreChart />)

        expect(screen.getByText(/Complete a test to see your score history/)).toBeTruthy()
    })

    it('ScoreChart randeaza graficul cand exista date', () => {
        render(<ScoreChart data={[{ month: 'Jan', score: 70 }]} />)

        expect(screen.getByText('Average score over time')).toBeTruthy()
        expect(screen.queryByText(/Complete a test/)).toBeNull()
    })

    it('SkillRadar afiseaza starea goala', () => {
        render(<SkillRadar />)

        expect(screen.getByText('Your performance across categories')).toBeTruthy()
    })

    it('SkillRadar evidentiaza cea mai buna si cea mai slaba categorie', () => {
        render(
            <SkillRadar
                data={[
                    { skill: 'Frontend', score: 90 },
                    { skill: 'Backend', score: 40 },
                ]}
            />
        )

        expect(screen.getByText('Frontend')).toBeTruthy()
        expect(screen.getByText('Backend')).toBeTruthy()
    })
})

describe('Sidebar', () => {
    it('marcheaza vizualizarea activa si schimba vizualizarea la click', () => {
        const onViewChange = vi.fn()
        const onClose = vi.fn()
        render(
            <Sidebar activeView="Dashboard" onViewChange={onViewChange} mobileOpen={false} onClose={onClose} />
        )

        expect(screen.getByRole('button', { name: 'Dashboard' }).getAttribute('aria-current')).toBe('page')

        fireEvent.click(screen.getByRole('button', { name: 'Results' }))

        expect(onViewChange).toHaveBeenCalledWith('Results')
    })

    it('afiseaza overlay-ul pe mobil si il inchide', () => {
        const onClose = vi.fn()
        render(
            <Sidebar activeView="Tests" onViewChange={vi.fn()} mobileOpen onClose={onClose} />
        )

        const closeButtons = screen.getAllByRole('button', { name: 'Close menu' })
        expect(closeButtons).toHaveLength(2)

        fireEvent.click(closeButtons[1])
        expect(onClose).toHaveBeenCalled()
    })
})

describe('Topbar', () => {
    const data = { name: 'ana pop', email: 'ana@test.com' }

    it('afiseaza initiala, numele si emailul', () => {
        render(<Topbar data={data} onMenuOpen={vi.fn()} />)

        expect(screen.getByText('A')).toBeTruthy()
        expect(screen.getByText('ana pop')).toBeTruthy()
        expect(screen.getByText('ana@test.com')).toBeTruthy()
    })

    it('deschide meniul mobil', () => {
        const onMenuOpen = vi.fn()
        render(<Topbar data={data} onMenuOpen={onMenuOpen} />)

        fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))

        expect(onMenuOpen).toHaveBeenCalled()
    })

    it('deschide dropdown-ul si face sign out', () => {
        render(<Topbar data={data} onMenuOpen={vi.fn()} />)

        expect(screen.queryByText('Sign out')).toBeNull()

        fireEvent.click(screen.getByRole('button', { name: 'User menu' }))
        fireEvent.click(screen.getByText('Sign out'))

        expect(signOut).toHaveBeenCalled()
        expect(screen.queryByText('Sign out')).toBeNull()
    })

    it('inchide dropdown-ul la click in afara', () => {
        render(<Topbar data={data} onMenuOpen={vi.fn()} />)

        fireEvent.click(screen.getByRole('button', { name: 'User menu' }))
        expect(screen.getByText('Sign out')).toBeTruthy()

        fireEvent.mouseDown(document.body)

        expect(screen.queryByText('Sign out')).toBeNull()
    })
})

describe('Pagination', () => {
    it('afiseaza intervalul de elemente si paginile', () => {
        render(
            <Pagination currentPage={2} totalPages={3} totalItems={14} itemsPerPage={6} onPageChange={vi.fn()} />
        )

        expect(screen.getByText('Showing 7 to 12 of 14 items')).toBeTruthy()
        expect(screen.getByText('Page 2 of 3')).toBeTruthy()
    })

    it('navigheaza inainte si inapoi', () => {
        const onPageChange = vi.fn()
        render(
            <Pagination currentPage={2} totalPages={3} totalItems={14} itemsPerPage={6} onPageChange={onPageChange} />
        )

        fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
        expect(onPageChange).toHaveBeenCalledWith(1)

        fireEvent.click(screen.getByRole('button', { name: 'Next' }))
        expect(onPageChange).toHaveBeenCalledWith(3)
    })

    it('dezactiveaza butoanele la limite si afiseaza 0 elemente', () => {
        render(
            <Pagination currentPage={1} totalPages={0} totalItems={0} itemsPerPage={6} onPageChange={vi.fn()} />
        )

        expect(screen.getByText('Showing 0 to 0 of 0 items')).toBeTruthy()
        expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true)
        expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true)
    })
})

describe('SearchBar', () => {
    it('transmite textul cautat', () => {
        const onChange = vi.fn()
        render(<SearchBar value="" onChange={onChange} />)

        fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'react' } })

        expect(onChange).toHaveBeenCalledWith('react')
    })

    it('afiseaza butonul de golire doar cand exista text', () => {
        const onChange = vi.fn()
        const { rerender } = render(<SearchBar value="" onChange={onChange} placeholder="Cauta" />)

        expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()

        rerender(<SearchBar value="react" onChange={onChange} placeholder="Cauta" />)
        fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))

        expect(onChange).toHaveBeenCalledWith('')
    })
})
