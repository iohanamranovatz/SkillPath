import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import QuestionTable from '@/frontend/admin/Questions/table'
import QuestionPanel from '@/frontend/admin/Questions/panel'
import QuestionForm from '@/frontend/admin/Questions/form'
import QuestionToolbar from '@/frontend/admin/Questions/toolbar'
import {
    deleteQuestion,
    createQuestion,
    updateQuestion,
    getAllCategories,
} from '@/backend/admin/actions/questions'

const nav = vi.hoisted(() => ({
    pathname: '/questions',
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

vi.mock('@/backend/admin/actions/questions', () => ({
    deleteQuestion: vi.fn(),
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    getAllCategories: vi.fn(),
}))

const QUESTIONS = [
    {
        id: '1',
        title: 'Ce este JSX?',
        text: 'Explica JSX',
        category: 'Frontend',
        difficulty: 'EASY' as const,
        options: [
            { id: 'opt_1', text: 'Sintaxa' },
            { id: 'opt_2', text: 'Framework' },
        ],
        correctAnswersId: 'opt_1',
        isActive: true,
    },
    {
        id: '2',
        title: 'Ce este un index?',
        text: 'Explica indexul',
        category: 'Databases',
        difficulty: 'HARD' as const,
        options: [{ id: 'opt_1', text: 'Structura' }],
        correctAnswersId: 'opt_1',
        isActive: false,
    },
    {
        id: '3',
        title: 'Fara dificultate',
        text: '...',
        category: 'Other',
        difficulty: 'MEDIUM' as const,
        options: [],
        correctAnswersId: '',
        isActive: false,
    },
]

beforeEach(() => {
    vi.clearAllMocks()
    nav.search = ''
    vi.mocked(getAllCategories).mockResolvedValue(['Frontend', 'Databases'])
})

describe('QuestionTable', () => {
    it('afiseaza mesajul gol', () => {
        render(<QuestionTable questions={[]} />)

        expect(screen.getByText('No questions found.')).toBeTruthy()
    })

    it('afiseaza statusul si dificultatea fiecarei intrebari', () => {
        render(<QuestionTable questions={QUESTIONS} />)

        expect(screen.getByText('Ce este JSX?')).toBeTruthy()
        expect(screen.getByText('Active')).toBeTruthy()
        expect(screen.getAllByText('Draft')).toHaveLength(2)
        expect(screen.getByText('EASY')).toBeTruthy()
        expect(screen.getByText('HARD')).toBeTruthy()
    })

    it('deschide panoul la click pe rand si pe iconita', () => {
        render(<QuestionTable questions={QUESTIONS} />)

        fireEvent.click(screen.getByText('Ce este JSX?'))
        expect(nav.router.push).toHaveBeenCalledWith('/questions?id=1')

        fireEvent.click(screen.getAllByTitle('View Details')[1])
        expect(nav.router.push).toHaveBeenCalledWith('/questions?id=2')
    })

    it('sterge intrebarea doar dupa confirmare', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
        render(<QuestionTable questions={QUESTIONS} />)

        fireEvent.click(screen.getByRole('button', { name: 'Delete question 1' }))
        expect(deleteQuestion).not.toHaveBeenCalled()

        confirmSpy.mockReturnValue(true)
        vi.mocked(deleteQuestion).mockResolvedValue({ success: true } as any)
        fireEvent.click(screen.getByRole('button', { name: 'Delete question 1' }))

        await waitFor(() => expect(deleteQuestion).toHaveBeenCalledWith('1'))
        confirmSpy.mockRestore()
    })

    it('avertizeaza cand stergerea esueaza', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
        vi.mocked(deleteQuestion).mockResolvedValue({ success: false, error: 'Delete failed' } as any)
        render(<QuestionTable questions={QUESTIONS} />)

        fireEvent.click(screen.getByRole('button', { name: 'Delete question 1' }))

        await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Delete failed'))
        alertSpy.mockRestore()
    })
})

describe('QuestionPanel', () => {
    it('nu randeaza nimic fara id in url', () => {
        const { container } = render(<QuestionPanel questions={QUESTIONS} />)

        expect(container.firstChild).toBeNull()
    })

    it('nu randeaza nimic pentru un id inexistent', () => {
        nav.search = 'id=999'
        const { container } = render(<QuestionPanel questions={QUESTIONS} />)

        expect(container.firstChild).toBeNull()
    })

    it('afiseaza detaliile intrebarii si marcheaza raspunsul corect', () => {
        nav.search = 'id=1'
        render(<QuestionPanel questions={QUESTIONS} />)

        expect(screen.getByText('Question Details')).toBeTruthy()
        expect(screen.getByText('Explica JSX')).toBeTruthy()
        expect(screen.getByText('Sintaxa')).toBeTruthy()
    })

    it('trece in modul de editare si inapoi', async () => {
        nav.search = 'id=1'
        render(<QuestionPanel questions={QUESTIONS} />)

        fireEvent.click(screen.getByRole('button', { name: /Edit Question/ }))
        expect(screen.getByText('Edit Question')).toBeTruthy()

        fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
        expect(screen.getByText('Question Details')).toBeTruthy()
    })

    it('deschide formularul gol in modul de creare', () => {
        nav.search = 'id=new'
        render(<QuestionPanel questions={QUESTIONS} />)

        expect(screen.getByText('Add New Question')).toBeTruthy()
        expect(screen.getByRole('button', { name: 'Create Question' })).toBeTruthy()
    })

    it('inchide panoul din buton', () => {
        nav.search = 'id=1'
        const { container } = render(<QuestionPanel questions={QUESTIONS} />)

        fireEvent.click(container.querySelector('.fixed.inset-0')!)

        expect(nav.router.push).toHaveBeenCalledWith('/questions?')
    })
})

describe('QuestionForm', () => {
    const question = QUESTIONS[0]

    it('incarca lista de categorii', async () => {
        render(<QuestionForm question={question} onClose={vi.fn()} onCancel={vi.fn()} />)

        expect(screen.getByText('Loading categories...')).toBeTruthy()

        expect(await screen.findByRole('option', { name: 'Databases' })).toBeTruthy()
    })

    it('trateaza esecul incarcarii categoriilor', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.mocked(getAllCategories).mockRejectedValue(new Error('boom'))
        render(<QuestionForm question={question} onClose={vi.fn()} onCancel={vi.fn()} />)

        await waitFor(() => expect(screen.getByText('Select category')).toBeTruthy())
        consoleSpy.mockRestore()
    })

    it('actualizeaza intrebarea existenta', async () => {
        const onClose = vi.fn()
        vi.mocked(updateQuestion).mockResolvedValue({ success: true } as any)
        render(<QuestionForm question={question} onClose={onClose} onCancel={vi.fn()} />)
        await screen.findByRole('option', { name: 'Databases' })

        fireEvent.change(screen.getByDisplayValue('Ce este JSX?'), {
            target: { value: 'Titlu nou' },
        })
        fireEvent.change(screen.getByDisplayValue('Explica JSX'), {
            target: { value: 'Text nou' },
        })
        fireEvent.change(screen.getByDisplayValue('Sintaxa'), { target: { value: 'Sintaxa XML' } })
        fireEvent.click(screen.getByRole('checkbox'))
        fireEvent.submit(screen.getByRole('button', { name: 'Save Changes' }).closest('form')!)

        await waitFor(() => expect(onClose).toHaveBeenCalled())
        expect(updateQuestion).toHaveBeenCalledWith(
            '1',
            expect.objectContaining({
                title: 'Titlu nou',
                text: 'Text nou',
                isActive: false,
                correctAnswersId: 'opt_1',
            })
        )
    })

    it('comuta raspunsurile corecte', async () => {
        vi.mocked(updateQuestion).mockResolvedValue({ success: true } as any)
        render(<QuestionForm question={question} onClose={vi.fn()} onCancel={vi.fn()} />)
        await screen.findByRole('option', { name: 'Databases' })

        // deselecteaza optiunea 1 si selecteaza optiunea 2
        fireEvent.click(screen.getByTitle('Correct Answer (Selected)'))
        fireEvent.click(screen.getAllByTitle('Mark as correct')[1])
        fireEvent.submit(screen.getByRole('button', { name: 'Save Changes' }).closest('form')!)

        await waitFor(() =>
            expect(updateQuestion).toHaveBeenCalledWith(
                '1',
                expect.objectContaining({ correctAnswersId: 'opt_2' })
            )
        )
    })

    it('creeaza o intrebare noua', async () => {
        const onClose = vi.fn()
        vi.mocked(createQuestion).mockResolvedValue({ success: true } as any)
        render(
            <QuestionForm question={question} onClose={onClose} onCancel={vi.fn()} isCreateMode />
        )
        await screen.findByRole('option', { name: 'Databases' })

        fireEvent.submit(screen.getByRole('button', { name: 'Create Question' }).closest('form')!)

        await waitFor(() => expect(createQuestion).toHaveBeenCalled())
        expect(onClose).toHaveBeenCalled()
    })

    it('afiseaza eroarea de la server', async () => {
        vi.mocked(updateQuestion).mockResolvedValue({
            success: false,
            error: 'You must select at least one correct answer.',
        } as any)
        render(<QuestionForm question={question} onClose={vi.fn()} onCancel={vi.fn()} />)
        await screen.findByRole('option', { name: 'Databases' })

        fireEvent.submit(screen.getByRole('button', { name: 'Save Changes' }).closest('form')!)

        expect(
            await screen.findByText('You must select at least one correct answer.')
        ).toBeTruthy()
    })

    it('foloseste un mesaj implicit cand serverul nu trimite unul', async () => {
        vi.mocked(updateQuestion).mockResolvedValue({ success: false } as any)
        render(<QuestionForm question={question} onClose={vi.fn()} onCancel={vi.fn()} />)
        await screen.findByRole('option', { name: 'Databases' })

        fireEvent.submit(screen.getByRole('button', { name: 'Save Changes' }).closest('form')!)

        expect(await screen.findByText('Failed to update question.')).toBeTruthy()
    })

    it('accepta o intrebare cu mai multe raspunsuri corecte si campuri lipsa', async () => {
        render(
            <QuestionForm
                question={{ ...QUESTIONS[2], correctAnswersId: ['a', 'b'] as any, title: '', text: '' }}
                onClose={vi.fn()}
                onCancel={vi.fn()}
            />
        )

        expect(await screen.findByRole('option', { name: 'Frontend' })).toBeTruthy()
    })

    it('anuleaza editarea', async () => {
        const onCancel = vi.fn()
        render(<QuestionForm question={question} onClose={vi.fn()} onCancel={onCancel} />)

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(onCancel).toHaveBeenCalled()
    })
})

describe('QuestionToolbar', () => {
    it('transmite cautarea si dificultatea', () => {
        const onSearchChange = vi.fn()
        const onDifficultyChange = vi.fn()
        render(
            <QuestionToolbar
                searchTerm=""
                onSearchChange={onSearchChange}
                difficulty="all"
                onDifficultyChange={onDifficultyChange}
            />
        )

        fireEvent.change(screen.getByPlaceholderText('Search questions...'), {
            target: { value: 'jsx' },
        })
        expect(onSearchChange).toHaveBeenCalledWith('jsx')

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'HARD' } })
        expect(onDifficultyChange).toHaveBeenCalledWith('HARD')
    })

    it('adauga id=new in url la apasarea butonului de adaugare', () => {
        const pushState = vi.spyOn(window.history, 'pushState')
        render(
            <QuestionToolbar
                searchTerm=""
                onSearchChange={vi.fn()}
                difficulty="all"
                onDifficultyChange={vi.fn()}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: /Add Question/ }))

        expect(pushState).toHaveBeenCalledWith(null, '', '?id=new')
        pushState.mockRestore()
    })
})
