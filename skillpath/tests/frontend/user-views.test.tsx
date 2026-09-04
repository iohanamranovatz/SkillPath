import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'

import { TestsView, type UserTest } from '@/frontend/user/components/tests-view'
import { ResourcesView } from '@/frontend/user/components/resources-view'
import { NewTestForm } from '@/frontend/user/components/new-test-form'
import { AssessmentRunner } from '@/frontend/user/components/assessment-runner'
import { AssessmentViewer } from '@/frontend/user/components/assessmen-viewer'
import { ProfileView } from '@/frontend/user/components/profile-view'
import { ResultsView } from '@/frontend/user/components/results-view'

import { generateAssessment } from '@/backend/user/generateAssessment'
import { submitAssessment } from '@/backend/user/submitAssessment'
import { saveSingleAnswer } from '@/backend/user/saveProgressAssessment'
import { updateProfile } from '@/backend/user/profile/updateProfile'
import {
    addObjective,
    deleteObjective,
    toggleInterestTag,
    toggleObjective,
} from '@/backend/user/profile/profileActions'
import {
    getAssessmentAnalytics,
    toggleResourceCompletion,
} from '@/backend/user/actions/getAssessmentAnalytics'

vi.mock('@/backend/user/generateAssessment', () => ({ generateAssessment: vi.fn() }))
vi.mock('@/backend/user/submitAssessment', () => ({ submitAssessment: vi.fn() }))
vi.mock('@/backend/user/saveProgressAssessment', () => ({ saveSingleAnswer: vi.fn() }))
vi.mock('@/backend/user/profile/updateProfile', () => ({ updateProfile: vi.fn() }))
vi.mock('@/backend/user/profile/profileActions', () => ({
    addObjective: vi.fn(),
    deleteObjective: vi.fn(),
    toggleInterestTag: vi.fn(),
    toggleObjective: vi.fn(),
}))
vi.mock('@/backend/user/actions/getAssessmentAnalytics', () => ({
    getAssessmentAnalytics: vi.fn(),
    toggleResourceCompletion: vi.fn(),
}))

const router = (useRouter as any)()

beforeEach(() => {
    vi.clearAllMocks()
})

describe('TestsView', () => {
    const onboardingState = {
        requiresInitialAssessment: false,
        activeInitialAssessmentId: null,
        completedInitialAssessmentId: null,
    }

    function makeTests(count: number): UserTest[] {
        return Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            categories: i % 2 === 0 ? ['Frontend'] : ['Backend'],
            questions: 10,
            score: i % 2 === 0 ? 80 : null,
            status: i % 2 === 0 ? 'completed' : 'in_progress',
            startedAt: null,
            completedAt: null,
        }))
    }

    it('afiseaza filtrele derivate din categoriile testelor', () => {
        render(<TestsView tests={makeTests(2)} id={1} initialOnboardingState={onboardingState} />)

        expect(screen.getByRole('button', { name: 'All tests' })).toBeTruthy()
        expect(screen.getByRole('button', { name: 'Frontend' })).toBeTruthy()
        expect(screen.getByRole('button', { name: 'Completed' })).toBeTruthy()
    })

    it('filtreaza dupa categorie si dupa teste finalizate', () => {
        render(<TestsView tests={makeTests(4)} id={1} initialOnboardingState={onboardingState} />)

        fireEvent.click(screen.getByRole('button', { name: 'Backend' }))
        expect(screen.getAllByRole('heading', { name: 'Backend' })).toHaveLength(2)

        fireEvent.click(screen.getByRole('button', { name: 'Completed' }))
        expect(screen.getAllByText('Completed').length).toBeGreaterThan(1)
    })

    it('afiseaza mesajul gol cand filtrul nu are rezultate', () => {
        render(
            <TestsView
                tests={[{ ...makeTests(1)[0], score: null, status: 'in_progress' }]}
                id={1} initialOnboardingState={onboardingState}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: 'Completed' }))

        expect(screen.getByText('No tests in this category yet.')).toBeTruthy()
    })

    it('pagineaza cate 4 teste', () => {
        render(<TestsView tests={makeTests(6)} id={1} initialOnboardingState={onboardingState} />)

        expect(screen.getByText('Page 1 of 2')).toBeTruthy()

        const [prev, next] = screen.getAllByRole('button').slice(-2)
        expect((prev as HTMLButtonElement).disabled).toBe(true)

        fireEvent.click(next)
        expect(screen.getByText('Page 2 of 2')).toBeTruthy()

        fireEvent.click(screen.getAllByRole('button').slice(-2)[0])
        expect(screen.getByText('Page 1 of 2')).toBeTruthy()
    })

    it('reseteaza pagina la schimbarea filtrului', () => {
        render(<TestsView tests={makeTests(6)} id={1} initialOnboardingState={onboardingState} />)

        fireEvent.click(screen.getAllByRole('button').slice(-1)[0])
        expect(screen.getByText('Page 2 of 2')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'All tests' }))
        expect(screen.getByText('Page 1 of 2')).toBeTruthy()
    })

    it('navigheaza la test sau la rezultat, dupa caz', () => {
        render(<TestsView tests={makeTests(2)} id={1} initialOnboardingState={onboardingState} />)

        fireEvent.click(screen.getByRole('button', { name: /Review/ }))
        expect(router.push).toHaveBeenCalledWith('/assessment/1/completed')

        fireEvent.click(screen.getByRole('button', { name: /Take test/ }))
        expect(router.push).toHaveBeenCalledWith('/assessment/2')

        fireEvent.click(screen.getByRole('button', { name: /Start a test/ }))
        expect(router.push).toHaveBeenCalledWith('/assessment/new')
    })
})

describe('ResourcesView', () => {
    const resources = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        title: `Resursa ${i + 1}`,
        url: `https://x.dev/${i + 1}`,
        type: i === 0 ? 'course' : i === 1 ? 'video' : 'article',
        category: i < 4 ? 'Frontend' : 'Backend',
    }))

    it('afiseaza primele 6 resurse si pagineaza restul', () => {
        render(<ResourcesView resources={resources} />)

        expect(screen.getByText('Resursa 1')).toBeTruthy()
        expect(screen.queryByText('Resursa 7')).toBeNull()
        expect(screen.getByText('Page 1 of 2')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Next' }))

        expect(screen.getByText('Resursa 7')).toBeTruthy()
    })

    it('filtreaza dupa categorie sau titlu', () => {
        render(<ResourcesView resources={resources} />)

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'backend' } })

        expect(screen.queryByText('Resursa 1')).toBeNull()
        expect(screen.getByText('Resursa 5')).toBeTruthy()
    })

    it('afiseaza mesajul gol cand nu exista potriviri', () => {
        render(<ResourcesView resources={resources} />)

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'inexistent' } })

        expect(screen.getByText('No resources available found.')).toBeTruthy()
    })

    it('functioneaza fara resurse', () => {
        render(<ResourcesView />)

        expect(screen.getByText('No resources available found.')).toBeTruthy()
    })
})

describe('NewTestForm', () => {
    const categories = [
        { id: 1, name: 'Frontend' },
        { id: 2, name: 'Backend' },
    ]

    it('anunta cand nu exista categorii disponibile', () => {
        render(<NewTestForm userId={5} categories={[]} userLevel="Beginner" />)

        expect(screen.getByText(/Nu exista categorii/)).toBeTruthy()
        expect(screen.queryByRole('button', { name: 'Start test' })).toBeNull()
    })

    it('cere alegerea unei categorii inainte de start', () => {
        render(<NewTestForm userId={5} categories={categories} userLevel="Beginner" />)

        expect((screen.getByRole('button', { name: 'Start test' }) as HTMLButtonElement).disabled).toBe(true)
    })

    it('genereaza testul si navigheaza la el', async () => {
        vi.mocked(generateAssessment).mockResolvedValue({
            success: true,
            data: { assessmentId: 42, questions: [] },
        } as any)
        render(<NewTestForm userId={5} categories={categories} userLevel="Intermediate" />)

        fireEvent.click(screen.getByRole('button', { name: 'Backend' }))
        fireEvent.click(screen.getByRole('button', { name: 'Start test' }))

        await waitFor(() => expect(router.push).toHaveBeenCalledWith('/assessment/42'))
        expect(generateAssessment).toHaveBeenCalledWith(5, 2)
    })

    it('afiseaza eroarea returnata de server', async () => {
        vi.mocked(generateAssessment).mockResolvedValue({
            success: false,
            message: 'Sorry, no questions found!',
            data: null,
        } as any)
        render(<NewTestForm userId={5} categories={categories} userLevel="Beginner" />)

        fireEvent.click(screen.getByRole('button', { name: 'Frontend' }))
        fireEvent.click(screen.getByRole('button', { name: 'Start test' }))

        expect(await screen.findByText('Sorry, no questions found!')).toBeTruthy()
        expect(router.push).not.toHaveBeenCalled()
    })

    it('afiseaza un mesaj implicit cand serverul nu trimite unul', async () => {
        vi.mocked(generateAssessment).mockResolvedValue({ success: false, data: null } as any)
        render(<NewTestForm userId={5} categories={categories} userLevel="Beginner" />)

        fireEvent.click(screen.getByRole('button', { name: 'Frontend' }))
        fireEvent.click(screen.getByRole('button', { name: 'Start test' }))

        expect(await screen.findByText('Sorry, error at generating test.')).toBeTruthy()
    })
})

describe('AssessmentRunner', () => {
    const questions = [
        {
            id: 1,
            question_text: 'Ce este JSX?',
            difficulty: 'EASY',
            options: [
                { id: 'a', text: 'Sintaxa' },
                { id: 'b', text: 'Framework' },
            ],
            selectedOptionId: null,
        },
        {
            id: 2,
            question_text: 'Ce este un hook?',
            difficulty: 'MEDIUM',
            options: [
                { id: 'a', text: 'Functie' },
                { id: 'b', text: 'Clasa' },
            ],
            selectedOptionId: 'a',
        },
    ]

    it('afiseaza intrebarile numerotate cu variante etichetate A, B', () => {
        render(<AssessmentRunner assessmentId={77} questions={questions} />)

        expect(screen.getByText('1. Ce este JSX?')).toBeTruthy()
        expect(screen.getByText('2. Ce este un hook?')).toBeTruthy()
        expect(screen.getByText('2 questions · answer them all.')).toBeTruthy()
    })

    it('salveaza automat raspunsul dupa 1,5 secunde', async () => {
        vi.useFakeTimers()
        try {
            render(<AssessmentRunner assessmentId={77} questions={questions} />)

            fireEvent.click(screen.getByText('Sintaxa'))
            expect(screen.getByText('Saving...')).toBeTruthy()
            expect(saveSingleAnswer).not.toHaveBeenCalled()

            await act(async () => {
                await vi.advanceTimersByTimeAsync(1500)
            })

            expect(saveSingleAnswer).toHaveBeenCalledWith(77, 1, 'a')
            expect(screen.queryByText('Saving...')).toBeNull()
        } finally {
            vi.useRealTimers()
        }
    })

    it('trimite testul si afiseaza scorul final', async () => {
        vi.mocked(submitAssessment).mockResolvedValue({
            success: true,
            data: {
                correct: 1,
                total: 2,
                scorePct: 50,
                perCategory: [
                    { category: 'Frontend', score: 40, correct: 2, total: 5 },
                    { category: 'Backend', score: 80, correct: 4, total: 5 },
                ],
                level: 'Intermediate',
                review: [
                    // q1: a ales 'a', corect era 'b'
                    { questionId: 1, selectedOptionId: 'a', correctOptionId: 'b', isCorrect: false },
                    // q2: a ales 'a', corect
                    { questionId: 2, selectedOptionId: 'a', correctOptionId: 'a', isCorrect: true },
                ],
            },
        } as any)
        window.scrollTo = vi.fn()
        render(<AssessmentRunner assessmentId={77} questions={questions} />)

        fireEvent.click(screen.getByText('Sintaxa'))
        fireEvent.click(screen.getByRole('button', { name: /Trimite|Finalizeaza|Submit/i }))

        expect(await screen.findByText('Test completed!')).toBeTruthy()
        expect(screen.getByText('50%')).toBeTruthy()
        expect(screen.getByText('1 out of 2 correct')).toBeTruthy()
        expect(screen.getByText('Intermediate')).toBeTruthy()
        // categoria sub 50% este marcata ca zona slaba
        expect(screen.getByText('40% · weak area')).toBeTruthy()

        // rezultatul arata si intrebarile cu raspunsul corect
        expect(screen.getByText('Your answers')).toBeTruthy()
        expect(screen.getByText('Correct answer')).toBeTruthy()
        expect(screen.getByText('Your answer')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Back to dashboard' }))
        expect(router.push).toHaveBeenCalledWith('/userDashboard')
    })

    it('afiseaza eroarea cand trimiterea esueaza', async () => {
        vi.mocked(submitAssessment).mockResolvedValue({
            success: false,
            message: 'Test invalid.',
            data: null,
        } as any)
        render(<AssessmentRunner assessmentId={77} questions={questions} />)

        fireEvent.click(screen.getByText('Sintaxa'))
        fireEvent.click(screen.getByRole('button', { name: /Trimite|Finalizeaza|Submit/i }))

        expect(await screen.findByText('Test invalid.')).toBeTruthy()
    })
})

describe('AssessmentViewer', () => {
    const questions = [
        {
            id: 1,
            question_text: 'Ce este JSX?',
            difficulty: 'EASY',
            options: [
                { id: 'a', text: 'Sintaxa' },
                { id: 'b', text: 'Framework' },
            ],
            selectedOptionId: 'a',
            isCorrect: true,
            correctAnswer: 'a',
        },
        {
            id: 2,
            question_text: 'Ce este un hook?',
            difficulty: 'HARD',
            options: [
                { id: 'a', text: 'Functie' },
                { id: 'b', text: 'Clasa' },
            ],
            selectedOptionId: 'b',
            isCorrect: false,
            correctAnswer: 'a',
        },
    ]

    it('afiseaza scorul, detaliile si raspunsurile', () => {
        render(
            <AssessmentViewer
                assessmentId={77}
                score={50}
                questions={questions}
                details={{ category: 'Frontend', dateStarted: '1 Sep 2026' }}
            />
        )

        expect(screen.getByText('50%')).toBeTruthy()
        expect(screen.getByText('Frontend')).toBeTruthy()
        expect(screen.getByText('Started: 1 Sep 2026')).toBeTruthy()
        expect(screen.getByText('1. Ce este JSX?')).toBeTruthy()
        expect(screen.getByText('2. Ce este un hook?')).toBeTruthy()
    })

    it('ascunde cardul de scor cand scorul lipseste', () => {
        render(
            <AssessmentViewer
                assessmentId={77}
                score={null as any}
                questions={[]}
                details={{ category: 'Frontend', dateStarted: '1 Sep 2026' }}
            />
        )

        expect(screen.queryByText('Final Score')).toBeNull()
    })

    it('navigheaza inapoi la dashboard', () => {
        render(
            <AssessmentViewer
                assessmentId={77}
                score={100}
                questions={questions}
                details={{ category: 'Frontend', dateStarted: '1 Sep 2026' }}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: 'Back to Dashboard' }))

        expect(router.push).toHaveBeenCalledWith('/userDashboard')
    })
})

describe('ProfileView', () => {
    const initialData = {
        id: 5,
        email: 'ana@test.com',
        name: 'Ana Pop',
        role: 'user',
        estimated_level: 'Intermediate',
    }
    const objectives = [
        { id: 1, title: 'Invat React', is_completed: true },
        { id: 2, title: 'Invat SQL', is_completed: false },
    ]
    const allTags = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Tag${i + 1}` }))

    function renderProfile(overrides: any = {}) {
        return render(
            <ProfileView
                initialData={initialData}
                objectives={objectives}
                userInterestTagIds={[1]}
                allTags={allTags}
                {...overrides}
            />
        )
    }

    it('afiseaza identitatea userului si initialele', () => {
        renderProfile()

        expect(screen.getByText('AN')).toBeTruthy()
        expect(screen.getByText('user · ana@test.com')).toBeTruthy()
        expect(screen.getByText('Intermediate')).toBeTruthy()
    })

    it('salveaza numele si afiseaza mesajul serverului', async () => {
        vi.mocked(updateProfile).mockResolvedValue({
            success: true,
            message: 'Profile updated successfully.',
        })
        renderProfile()

        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

        expect(await screen.findByText('Profile updated successfully.')).toBeTruthy()
    })

    it('adauga un obiectiv nou', async () => {
        renderProfile()

        fireEvent.change(screen.getByPlaceholderText('e.g. Master React Hooks'), {
            target: { value: 'Invat Docker' },
        })
        fireEvent.click(screen.getByRole('button', { name: /Add/ }))

        await waitFor(() => expect(addObjective).toHaveBeenCalledWith(5, 'Invat Docker'))
    })

    it('ignora obiectivele goale', () => {
        renderProfile()

        fireEvent.click(screen.getByRole('button', { name: /Add/ }))

        expect(addObjective).not.toHaveBeenCalled()
    })

    it('blocheaza adaugarea peste limita de 5 obiective', () => {
        renderProfile({
            objectives: Array.from({ length: 5 }, (_, i) => ({
                id: i + 1,
                title: `Obiectiv ${i + 1}`,
                is_completed: false,
            })),
        })

        expect(screen.getByText(/reached the maximum limit of 5 active objectives/)).toBeTruthy()
        expect((screen.getByRole('button', { name: /Add/ }) as HTMLButtonElement).disabled).toBe(true)
    })

    it('cauta si filtreaza obiectivele', () => {
        renderProfile()

        fireEvent.change(screen.getByPlaceholderText('Search objectives...'), {
            target: { value: 'sql' },
        })
        expect(screen.queryByText('Invat React')).toBeNull()
        expect(screen.getByText('Invat SQL')).toBeTruthy()

        fireEvent.change(screen.getByPlaceholderText('Search objectives...'), {
            target: { value: 'zzz' },
        })
        expect(screen.getByText('No objectives match your search/filter.')).toBeTruthy()
    })

    it.each([
        ['completed', 'Invat React', 'Invat SQL'],
        ['incompleted', 'Invat SQL', 'Invat React'],
    ])('filtreaza dupa statusul %s', (status, visible, hidden) => {
        renderProfile()

        fireEvent.click(screen.getByRole('button', { name: status }))

        expect(screen.getByText(visible)).toBeTruthy()
        expect(screen.queryByText(hidden)).toBeNull()
    })

    it('afiseaza progresul obiectivelor', () => {
        renderProfile()

        expect(screen.getByText('50%')).toBeTruthy()
    })

    it('anunta cand nu exista obiective', () => {
        renderProfile({ objectives: [] })

        expect(screen.getByText('No objectives added yet.')).toBeTruthy()
    })

    it('bifeaza un obiectiv', () => {
        const { container } = renderProfile()

        const checkButtons = container.querySelectorAll('.size-5')
        fireEvent.click(checkButtons[0])

        expect(toggleObjective).toHaveBeenCalledWith(1, true)
    })

    it('sterge obiectivul doar dupa confirmare', async () => {
        const { container } = renderProfile()
        const trashButtons = Array.from(container.querySelectorAll('button')).filter((b) =>
            b.className.includes('hover:text-red-400')
        )

        // clickul pe cos doar deschide dialogul
        fireEvent.click(trashButtons[0])
        expect(screen.getByText('Delete objective?')).toBeTruthy()
        expect(deleteObjective).not.toHaveBeenCalled()

        // Cancel inchide dialogul fara sa stearga
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
        await waitFor(() => expect(screen.queryByText('Delete objective?')).toBeNull())
        expect(deleteObjective).not.toHaveBeenCalled()

        fireEvent.click(trashButtons[0])
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
        await waitFor(() => expect(deleteObjective).toHaveBeenCalledWith(1))
    })

    it('afiseaza doar 8 taguri si le extinde la cerere', () => {
        renderProfile()

        expect(screen.queryByText(/Tag9/)).toBeNull()

        fireEvent.click(screen.getByRole('button', { name: '+ Show 2 more topics' }))
        expect(screen.getByText(/Tag9/)).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Show less' }))
        expect(screen.queryByText(/Tag9/)).toBeNull()
    })

    it('comuta un tag de interes', () => {
        renderProfile()

        fireEvent.click(screen.getByRole('button', { name: 'Tag2 +' }))

        expect(toggleInterestTag).toHaveBeenCalledWith(5, 2, false)
    })

    it('blocheaza selectarea peste limita de 5 taguri', () => {
        renderProfile({ userInterestTagIds: [1, 2, 3, 4, 5] })

        expect(screen.getByText(/Maximum limit of 5 topics reached/)).toBeTruthy()
        expect((screen.getByRole('button', { name: 'Tag6 +' }) as HTMLButtonElement).disabled).toBe(true)
    })
})

describe('ResultsView', () => {
    const analytics = {
        scoreTotal: 71,
        estimatedLevel: 'Intermediate',
        categoryScores: [
            { id: 1, name: 'Frontend', percentage: 80 },
            { id: 2, name: 'Backend', percentage: 40 },
        ],
        weakAreas: [{ id: 2, name: 'Backend', percentage: 40 }],
        recommendedResources: Array.from({ length: 7 }, (_, i) => ({
            id: i + 1,
            title: `Resursa ${i + 1}`,
            url: 'https://x.dev',
            type: 'article',
            categoryName: 'Backend',
            isCompleted: i === 0,
        })),
    }

    it('afiseaza starea de incarcare, apoi datele', async () => {
        vi.mocked(getAssessmentAnalytics).mockResolvedValue(analytics as any)
        render(<ResultsView />)

        expect(screen.getByText('Loading analytics...')).toBeTruthy()

        expect(await screen.findByText('71%')).toBeTruthy()
        expect(screen.getByText('Intermediate')).toBeTruthy()
        expect(screen.getByText('Identified Weaknesses (< 60%)')).toBeTruthy()
        expect(screen.getByText(/Progress of Completed Resources \(1\/7\)/)).toBeTruthy()
        expect(screen.getByText('14%')).toBeTruthy()
    })

    it('afiseaza mesajul gol cand analiza nu poate fi incarcata', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.mocked(getAssessmentAnalytics).mockRejectedValue(new Error('boom'))
        render(<ResultsView />)

        expect(await screen.findByText('No available results')).toBeTruthy()
        consoleSpy.mockRestore()
    })

    it('bifeaza o resursa parcursa', async () => {
        vi.mocked(getAssessmentAnalytics).mockResolvedValue(analytics as any)
        render(<ResultsView />)
        await screen.findByText('71%')

        const checkboxes = screen.getAllByRole('checkbox')
        fireEvent.click(checkboxes[1])

        await waitFor(() => expect(toggleResourceCompletion).toHaveBeenCalledWith(2, true))
        expect(screen.getByText(/Progress of Completed Resources \(2\/7\)/)).toBeTruthy()
    })

    it('filtreaza resursele pe categorie si pagineaza', async () => {
        vi.mocked(getAssessmentAnalytics).mockResolvedValue(analytics as any)
        render(<ResultsView />)
        await screen.findByText('71%')

        expect(screen.getByText('Page 1 of 2')).toBeTruthy()
        expect(screen.queryByText('Resursa 7')).toBeNull()

        fireEvent.click(screen.getByRole('button', { name: 'Backend' }))
        expect(screen.getByText('Resursa 1')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'All (7)' }))
        expect(screen.getByText('Resursa 6')).toBeTruthy()
    })

    it('nu afiseaza sectiunile optionale cand lipsesc datele', async () => {
        vi.mocked(getAssessmentAnalytics).mockResolvedValue({
            scoreTotal: 100,
            estimatedLevel: 'Advanced',
            categoryScores: [],
            weakAreas: [],
            recommendedResources: [],
        } as any)
        render(<ResultsView />)

        expect(await screen.findByText('100%')).toBeTruthy()
        expect(screen.queryByText(/Identified Weaknesses/)).toBeNull()
        expect(screen.queryByText(/Learning Recommendations/)).toBeNull()
    })
})
