import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { CategoriesManager } from '@/frontend/admin/Categories/CategoriesManager'
import { TagsManager } from '@/frontend/admin/Categories/TagsManager'
import { AddResourceForm } from '@/frontend/admin/Categories/AddResourceForm'
import {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryTags,
    addTag,
    updateTag,
    deleteTag,
    addResource,
} from '@/backend/categories'

const nav = vi.hoisted(() => ({
    router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
}))

vi.mock('next/navigation', () => ({
    useRouter: () => nav.router,
    usePathname: () => '/categories',
    useSearchParams: () => new URLSearchParams(),
    redirect: vi.fn(),
    notFound: vi.fn(),
}))

vi.mock('@/backend/categories', () => ({
    getCategories: vi.fn(),
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    getCategoryTags: vi.fn(),
    addTag: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
    addResource: vi.fn(),
}))

const CATEGORIES = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Categoria ${i + 1}`,
    description: i === 0 ? 'Descriere' : null,
    difficulty: 'Beginner',
    exerciseCount: i,
}))

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCategories).mockResolvedValue({ success: true, data: CATEGORIES } as any)
})

describe('CategoriesManager', () => {
    it('shows the loading state, then the first 6 categories', async () => {
        render(<CategoriesManager />)

        expect(screen.getByText('Loading…')).toBeTruthy()

        expect(await screen.findByText('Categoria 1')).toBeTruthy()
        expect(screen.queryByText('Categoria 7')).toBeNull()
        expect(screen.getByText('Page 1 of 2')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Next' }))
        expect(screen.getByText('Categoria 7')).toBeTruthy()
    })

    it('searches by name and shows the empty message', async () => {
        render(<CategoriesManager />)
        await screen.findByText('Categoria 1')

        fireEvent.change(screen.getByPlaceholderText('Search categories...'), {
            target: { value: 'Categoria 3' },
        })
        expect(screen.getByText('Categoria 3')).toBeTruthy()
        expect(screen.queryByText('Categoria 1')).toBeNull()

        fireEvent.change(screen.getByPlaceholderText('Search categories...'), {
            target: { value: 'inexistent' },
        })
        expect(screen.getByText('No categories found.')).toBeTruthy()
    })

    it('navigates to the category page', async () => {
        render(<CategoriesManager />)
        await screen.findByText('Categoria 1')

        fireEvent.click(screen.getByText('Categoria 1'))

        expect(nav.router.push).toHaveBeenCalledWith('/categories/1')
    })

    it('creates a new category', async () => {
        vi.mocked(addCategory).mockResolvedValue({ success: true } as any)
        render(<CategoriesManager />)
        await screen.findByText('Categoria 1')

        fireEvent.click(screen.getByRole('button', { name: /Add Category/ }))
        expect(screen.getByText('New Category')).toBeTruthy()

        fireEvent.change(screen.getByPlaceholderText('ex. Backend'), { target: { value: 'DevOps' } })
        fireEvent.change(screen.getByPlaceholderText('Short description…'), {
            target: { value: 'CI/CD' },
        })
        fireEvent.submit(screen.getByRole('button', { name: 'Create' }).closest('form')!)

        await waitFor(() =>
            expect(addCategory).toHaveBeenCalledWith({
                name: 'DevOps',
                description: 'CI/CD',
                difficulty: 'Beginner',
            })
        )
        await waitFor(() => expect(screen.queryByText('New Category')).toBeNull())
    })

    it('edits an existing category', async () => {
        vi.mocked(updateCategory).mockResolvedValue({ success: true } as any)
        const { container } = render(<CategoriesManager />)
        await screen.findByText('Categoria 1')

        fireEvent.click(container.querySelectorAll('[title="Edit"]')[0])
        expect(screen.getByText('Edit Category')).toBeTruthy()

        fireEvent.change(screen.getByDisplayValue('Categoria 1'), {
            target: { value: 'Categoria 1 - editata' },
        })
        fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!)

        await waitFor(() =>
            expect(updateCategory).toHaveBeenCalledWith({
                id: 1,
                name: 'Categoria 1 - editata',
                description: 'Descriere',
                difficulty: 'Beginner',
            })
        )
    })

    it('shows the error on save', async () => {
        vi.mocked(addCategory).mockResolvedValue({
            success: false,
            message: 'Name of the category is obligatory.',
        } as any)
        render(<CategoriesManager />)
        await screen.findByText('Categoria 1')

        fireEvent.click(screen.getByRole('button', { name: /Add Category/ }))
        fireEvent.submit(screen.getByRole('button', { name: 'Create' }).closest('form')!)

        expect(await screen.findByText('Name of the category is obligatory.')).toBeTruthy()
    })

    it('closes the modal from the Cancel button', async () => {
        render(<CategoriesManager />)
        await screen.findByText('Categoria 1')

        fireEvent.click(screen.getByRole('button', { name: /Add Category/ }))
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(screen.queryByText('New Category')).toBeNull()
    })

    it('deletes a category after confirmation', async () => {
        vi.mocked(deleteCategory).mockResolvedValue({ success: true } as any)
        const { container } = render(<CategoriesManager />)
        await screen.findByText('Categoria 1')

        fireEvent.click(container.querySelectorAll('[title="Delete"]')[0])
        expect(screen.getByText('Delete category?')).toBeTruthy()

        fireEvent.click(screen.getAllByRole('button', { name: /Delete/ }).slice(-1)[0])

        await waitFor(() => expect(deleteCategory).toHaveBeenCalledWith(1))
    })

    it('shows the error when the delete fails', async () => {
        vi.mocked(deleteCategory).mockResolvedValue({
            success: false,
            message: "You can't delete this category, questions and tags are tied to it.",
        } as any)
        const { container } = render(<CategoriesManager />)
        await screen.findByText('Categoria 1')

        fireEvent.click(container.querySelectorAll('[title="Delete"]')[0])
        fireEvent.click(screen.getAllByRole('button', { name: /Delete/ }).slice(-1)[0])

        await waitFor(() => expect(screen.queryByText('Delete category?')).toBeNull())
    })

    it('does not crash when loading the categories fails', async () => {
        vi.mocked(getCategories).mockResolvedValue({ success: false, message: 'boom', data: [] } as any)
        render(<CategoriesManager />)

        expect(await screen.findByText('No categories found.')).toBeTruthy()
    })
})

describe('TagsManager', () => {
    const tags = [
        { id: 1, name: 'React' },
        { id: 2, name: 'Hooks' },
    ]

    beforeEach(() => {
        vi.mocked(getCategoryTags).mockResolvedValue({ success: true, data: tags } as any)
    })

    it('shows the tags it receives', () => {
        render(<TagsManager categoryId={1} initialTags={tags} />)

        expect(screen.getByText('React')).toBeTruthy()
        expect(screen.getByText('Hooks')).toBeTruthy()
    })

    it('shows the empty message when there are no tags', () => {
        render(<TagsManager categoryId={1} initialTags={[]} />)

        expect(screen.getByText('No tags yet.')).toBeTruthy()
    })

    it('adds a tag and reloads the list', async () => {
        const onChange = vi.fn()
        vi.mocked(addTag).mockResolvedValue({ success: true } as any)
        render(<TagsManager categoryId={1} initialTags={[]} onChange={onChange} />)

        fireEvent.change(screen.getByPlaceholderText('Tag name…'), { target: { value: 'Next.js' } })
        fireEvent.submit(screen.getByRole('button', { name: /Add Tag/ }).closest('form')!)

        await waitFor(() => expect(addTag).toHaveBeenCalledWith({ categoryId: 1, name: 'Next.js' }))
        await waitFor(() => expect(onChange).toHaveBeenCalledWith(tags))
    })

    it('ignores an empty name', () => {
        render(<TagsManager categoryId={1} initialTags={[]} />)

        fireEvent.submit(screen.getByRole('button', { name: /Add Tag/ }).closest('form')!)

        expect(addTag).not.toHaveBeenCalled()
    })

    it('shows the error on add', async () => {
        vi.mocked(addTag).mockResolvedValue({ success: false, message: 'Tag Name is obligatory!' } as any)
        render(<TagsManager categoryId={1} initialTags={[]} />)

        fireEvent.change(screen.getByPlaceholderText('Tag name…'), { target: { value: 'X' } })
        fireEvent.submit(screen.getByRole('button', { name: /Add Tag/ }).closest('form')!)

        expect(await screen.findByText('Tag Name is obligatory!')).toBeTruthy()
    })

    it('edits a tag and saves with Enter', async () => {
        vi.mocked(updateTag).mockResolvedValue({ success: true } as any)
        render(<TagsManager categoryId={1} initialTags={tags} />)

        fireEvent.click(screen.getAllByTitle('Edit')[0])
        const input = screen.getByDisplayValue('React')

        fireEvent.change(input, { target: { value: 'React 19' } })
        fireEvent.keyDown(input, { key: 'Enter' })

        await waitFor(() => expect(updateTag).toHaveBeenCalledWith({ id: 1, name: 'React 19' }))
    })

    it('cancels editing with Escape and with the dedicated button', () => {
        render(<TagsManager categoryId={1} initialTags={tags} />)

        fireEvent.click(screen.getAllByTitle('Edit')[0])
        fireEvent.keyDown(screen.getByDisplayValue('React'), { key: 'Escape' })
        expect(screen.queryByDisplayValue('React')).toBeNull()

        fireEvent.click(screen.getAllByTitle('Edit')[0])
        fireEvent.click(screen.getByTitle('Cancel'))
        expect(screen.queryByDisplayValue('React')).toBeNull()
    })

    it('saves the edit from the button', async () => {
        vi.mocked(updateTag).mockResolvedValue({ success: true } as any)
        render(<TagsManager categoryId={1} initialTags={tags} />)

        fireEvent.click(screen.getAllByTitle('Edit')[1])
        fireEvent.click(screen.getByTitle('Save'))

        await waitFor(() => expect(updateTag).toHaveBeenCalledWith({ id: 2, name: 'Hooks' }))
    })

    it('deletes a tag', async () => {
        vi.mocked(deleteTag).mockResolvedValue({ success: true } as any)
        render(<TagsManager categoryId={1} initialTags={tags} />)

        fireEvent.click(screen.getAllByTitle('Delete')[0])

        await waitFor(() => expect(deleteTag).toHaveBeenCalledWith(1))
    })

    it('shows the error on delete', async () => {
        vi.mocked(deleteTag).mockResolvedValue({
            success: false,
            message: 'This tag cannot be deleted, questions are tied to it.',
        } as any)
        render(<TagsManager categoryId={1} initialTags={tags} />)

        fireEvent.click(screen.getAllByTitle('Delete')[0])

        expect(
            await screen.findByText('This tag cannot be deleted, questions are tied to it.')
        ).toBeTruthy()
    })
})

describe('AddResourceForm', () => {
    it('requires a title before submitting', () => {
        render(<AddResourceForm categoryId={1} />)

        fireEvent.submit(screen.getByRole('button', { name: /Add Resource/ }).closest('form')!)

        expect(screen.getByText('Please add a title.')).toBeTruthy()
        expect(addResource).not.toHaveBeenCalled()
    })

    it('adds the resource and resets the form', async () => {
        vi.mocked(addResource).mockResolvedValue({
            success: true,
            message: 'Resource was added!!',
        } as any)
        render(<AddResourceForm categoryId={3} />)

        fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Ghid' } })
        fireEvent.change(screen.getByPlaceholderText('URL'), { target: { value: 'https://x.dev' } })
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'video' } })
        fireEvent.submit(screen.getByRole('button', { name: /Add Resource/ }).closest('form')!)

        await waitFor(() =>
            expect(addResource).toHaveBeenCalledWith({
                categoryId: 3,
                title: 'Ghid',
                url: 'https://x.dev',
                type: 'video',
            })
        )
        expect(await screen.findByText('Resource was added!!')).toBeTruthy()
        expect((screen.getByPlaceholderText('Title') as HTMLInputElement).value).toBe('')
        expect(nav.router.refresh).toHaveBeenCalled()
    })

    it('keeps the data when the server rejects the request', async () => {
        vi.mocked(addResource).mockResolvedValue({ success: false, message: 'Missing category!' } as any)
        render(<AddResourceForm categoryId={0} />)

        fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Ghid' } })
        fireEvent.submit(screen.getByRole('button', { name: /Add Resource/ }).closest('form')!)

        expect(await screen.findByText('Missing category!')).toBeTruthy()
        expect((screen.getByPlaceholderText('Title') as HTMLInputElement).value).toBe('Ghid')
    })
})
