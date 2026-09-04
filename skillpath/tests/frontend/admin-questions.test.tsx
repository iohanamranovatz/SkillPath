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
    it('shows the empty message', () => {
        render(<QuestionTable questions={[]} />)

        expect(screen.getByText('No questions found.')).toBeTruthy()
    })

    it('shows the status and the difficulty of every question', () => {
        render(<QuestionTable questions={QUESTIONS} />)

        expect(screen.getByText('Ce este JSX?')).toBeTruthy()
        expect(screen.getByText('Active')).toBeTruthy()
        expect(screen.getAllByText('Draft')).toHaveLength(2)
        expect(screen.getByText('EASY')).toBeTruthy()
        expect(screen.getByText('HARD')).toBeTruthy()
    })

    it('opens the panel on a row click and on the icon', () => {
        render(<QuestionTable questions={QUESTIONS} />)

        fireEvent.click(screen.getByText('Ce este JSX?'))
        expect(nav.router.push).toHaveBeenCalledWith('/questions?id=1')

        fireEvent.click(screen.getAllByTitle('View Details')[1])
        expect(nav.router.push).toHaveBeenCalledWith('/questions?id=2')
    })

    it('deletes the question only after confirmation', async () => {
        render(<QuestionTable questions={QUESTIONS} />)

        // clicking the bin only opens the modal, it does not delete
        fireEvent.click(screen.getByRole('button', { name: 'Delete question 1' }))
        expect(screen.getByText('Delete question?')).toBeTruthy()
        expect(deleteQuestion).not.toHaveBeenCalled()

        // Cancel closes the modal without deleting
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
        await waitFor(() => expect(screen.queryByText('Delete question?')).toBeNull())
        expect(deleteQuestion).not.toHaveBeenCalled()

        // confirming in the modal triggers the delete
        vi.mocked(deleteQuestion).mockResolvedValue({ success: true } as any)
        fireEvent.click(screen.getByRole('button', { name: 'Delete question 1' }))
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

        await waitFor(() => expect(deleteQuestion).toHaveBeenCalledWith('1'))
        await waitFor(() => expect(screen.queryByText('Delete question?')).toBeNull())
    })

    it('warns when the delete fails', async () => {
        vi.mocked(deleteQuestion).mockResolvedValue({ success: false, error: 'Delete failed' } as any)
        render(<QuestionTable questions={QUESTIONS} />)

        fireEvent.click(screen.getByRole('button', { name: 'Delete question 1' }))
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

        // the error stays visible in the modal, the modal does not close
        await waitFor(() => expect(screen.getByText('Delete failed')).toBeTruthy())
        expect(screen.getByText('Delete question?')).toBeTruthy()
    })
})

describe('QuestionPanel', () => {
    it('renders nothing without an id in the url', () => {
        const { container } = render(<QuestionPanel questions={QUESTIONS} />)

        expect(container.firstChild).toBeNull()
    })

    it('renders nothing for a non-existent id', () => {
        nav.search = 'id=999'
        const { container } = render(<QuestionPanel questions={QUESTIONS} />)

        expect(container.firstChild).toBeNull()
    })

    it('shows the question details and marks the correct answer', () => {
        nav.search = 'id=1'
        render(<QuestionPanel questions={QUESTIONS} />)

        expect(screen.getByText('Question Details')).toBeTruthy()
        expect(screen.getByText('Explica JSX')).toBeTruthy()
        expect(screen.getByText('Sintaxa')).toBeTruthy()
    })

    it('switches to edit mode and back', async () => {
        nav.search = 'id=1'
        render(<QuestionPanel questions={QUESTIONS} />)

        fireEvent.click(screen.getByRole('button', { name: /Edit Question/ }))
        expect(screen.getByText('Edit Question')).toBeTruthy()

        fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
        expect(screen.getByText('Question Details')).toBeTruthy()
    })

    it('opens the empty form in create mode', () => {
        nav.search = 'id=new'
        render(<QuestionPanel questions={QUESTIONS} />)

        expect(screen.getByText('Add New Question')).toBeTruthy()
        expect(screen.getByRole('button', { name: 'Create Question' })).toBeTruthy()
    })

    it('closes the panel from the button', () => {
        nav.search = 'id=1'
        const { container } = render(<QuestionPanel questions={QUESTIONS} />)

        fireEvent.click(container.querySelector('.fixed.inset-0')!)

        expect(nav.router.push).toHaveBeenCalledWith('/questions?')
    })
})

describe('QuestionForm', () => {
    const question = QUESTIONS[0]

    it('loads the category list', async () => {
        render(<QuestionForm question={question} onClose={vi.fn()} onCancel={vi.fn()} />)

        expect(screen.getByText('Loading categories...')).toBeTruthy()

        expect(await screen.findByRole('option', { name: 'Databases' })).toBeTruthy()
    })

    it('handles the failure of loading the categories', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.mocked(getAllCategories).mockRejectedValue(new Error('boom'))
        render(<QuestionForm question={question} onClose={vi.fn()} onCancel={vi.fn()} />)

        await waitFor(() => expect(screen.getByText('Select category')).toBeTruthy())
        consoleSpy.mockRestore()
    })

    it('updates the existing question', async () => {
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

    it('allows a single correct answer', async () => {
        vi.mocked(updateQuestion).mockResolvedValue({ success: true } as any)
        render(<QuestionForm question={question} onClose={vi.fn()} onCancel={vi.fn()} />)
        await screen.findByRole('option', { name: 'Databases' })

        // initial e selectata prima optiune
        expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1)

        // picking another option replaces the previous one, they do not add up
        fireEvent.click(screen.getAllByTitle('Mark as correct')[0])
        expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1)

        fireEvent.submit(screen.getByRole('button', { name: 'Save Changes' }).closest('form')!)

        await waitFor(() =>
            expect(updateQuestion).toHaveBeenCalledWith(
                '1',
                expect.objectContaining({ correctAnswersId: 'opt_2' })
            )
        )
    })

    it('does not submit the form without a correct answer selected', async () => {
        render(
            <QuestionForm
                question={{ ...question, correctAnswersId: '' }}
                onClose={vi.fn()}
                onCancel={vi.fn()}
            />
        )
        await screen.findByRole('option', { name: 'Databases' })

        fireEvent.submit(screen.getByRole('button', { name: 'Save Changes' }).closest('form')!)

        expect(await screen.findByText('You must select the correct answer.')).toBeTruthy()
        expect(updateQuestion).not.toHaveBeenCalled()
    })

    it('creates a new question', async () => {
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

    it('shows the error from the server', async () => {
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

    it('uses a default message when the server does not send one', async () => {
        vi.mocked(updateQuestion).mockResolvedValue({ success: false } as any)
        render(<QuestionForm question={question} onClose={vi.fn()} onCancel={vi.fn()} />)
        await screen.findByRole('option', { name: 'Databases' })

        fireEvent.submit(screen.getByRole('button', { name: 'Save Changes' }).closest('form')!)

        expect(await screen.findByText('Failed to update question.')).toBeTruthy()
    })

    it('accepts a question with several correct answers and missing fields', async () => {
        render(
            <QuestionForm
                question={{ ...QUESTIONS[2], correctAnswersId: ['a', 'b'] as any, title: '', text: '' }}
                onClose={vi.fn()}
                onCancel={vi.fn()}
            />
        )

        expect(await screen.findByRole('option', { name: 'Frontend' })).toBeTruthy()
    })

    it('cancels editing', async () => {
        const onCancel = vi.fn()
        render(<QuestionForm question={question} onClose={vi.fn()} onCancel={onCancel} />)

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(onCancel).toHaveBeenCalled()
    })
})

describe('QuestionToolbar', () => {
    it('passes the search term and the difficulty', () => {
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

    it('adds id=new to the url when the add button is pressed', () => {
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
