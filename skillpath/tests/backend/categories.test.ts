import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    getCategories,
    getCategoryById,
    getCategoryTags,
    getResourcesFromCategory,
    addResource,
    updateCategory,
    deleteCategory,
    addTag,
    updateTag,
    deleteTag,
    addCategory,
    getQuestionsByCategory,
    getAllResources,
    fetchAllResourcesWrapper,
} from '@/backend/categories'
import { supabase } from '@/helper/SupabaseClient'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/SupabaseClient', () => {
    const client = { from: vi.fn() }
    return { default: client, supabase: client }
})

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('backend/categories', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getCategories', () => {
        it('returneaza categoriile cu numarul de intrebari calculat', async () => {
            mockFrom(supabase.from, {
                categories: {
                    data: [
                        { id: 1, name: 'Frontend', description: 'React', questions: [{ count: 5 }] },
                        { id: 2, name: 'Backend', description: 'Node', questions: [] },
                    ],
                    error: null,
                },
            })

            const result = await getCategories()

            expect(result.success).toBe(true)
            expect(result.data).toEqual([
                { id: 1, name: 'Frontend', description: 'React', exerciseCount: 5 },
                { id: 2, name: 'Backend', description: 'Node', exerciseCount: 0 },
            ])
        })

        it('returneaza lista goala si mesajul erorii cand query-ul esueaza', async () => {
            mockFrom(supabase.from, {
                categories: { data: null, error: { message: 'DB down' } },
            })

            const result = await getCategories()

            expect(result).toEqual({ success: false, message: 'DB down', data: [] })
        })

        it('trateaza data null ca lista goala', async () => {
            mockFrom(supabase.from, { categories: { data: null, error: null } })

            const result = await getCategories()

            expect(result.data).toEqual([])
        })
    })

    describe('getCategoryById', () => {
        it('returneaza categoria gasita', async () => {
            const category = { id: 1, name: 'Frontend', description: 'React' }
            const queries = mockFrom(supabase.from, { categories: { data: category, error: null } })

            const result = await getCategoryById(1)

            expect(result).toEqual({ success: true, data: category })
            expect(queries.categories[0].eq).toHaveBeenCalledWith('id', 1)
        })

        it('returneaza eroare cand categoria nu exista', async () => {
            mockFrom(supabase.from, { categories: { data: null, error: { message: 'Not found' } } })

            const result = await getCategoryById(99)

            expect(result).toEqual({ success: false, message: 'Not found', data: null })
        })
    })

    describe('getCategoryTags', () => {
        it('returneaza tagurile categoriei ordonate alfabetic', async () => {
            const tags = [{ id: 1, name: 'React' }, { id: 2, name: 'Next.js' }]
            const queries = mockFrom(supabase.from, { tags: { data: tags, error: null } })

            const result = await getCategoryTags(1)

            expect(result).toEqual({ success: true, data: tags })
            expect(queries.tags[0].eq).toHaveBeenCalledWith('category_id', 1)
            expect(queries.tags[0].order).toHaveBeenCalledWith('name', { ascending: true })
        })

        it('returneaza array gol cand data lipseste', async () => {
            mockFrom(supabase.from, { tags: { data: null, error: null } })

            const result = await getCategoryTags(1)

            expect(result.data).toEqual([])
        })

        it('propaga eroarea de la baza de date', async () => {
            mockFrom(supabase.from, { tags: { data: null, error: { message: 'Eroare taguri' } } })

            const result = await getCategoryTags(1)

            expect(result).toEqual({ success: false, message: 'Eroare taguri', data: [] })
        })
    })

    describe('getResourcesFromCategory', () => {
        it('mapeaza resursele in forma folosita de UI', async () => {
            mockFrom(supabase.from, {
                learning_resources: {
                    data: [
                        { id: 10, title: 'React Docs', url: 'https://react.dev', type: 'article', category_id: 1 },
                    ],
                    error: null,
                },
            })

            const result = await getResourcesFromCategory(1)

            expect(result.success).toBe(true)
            expect(result.data).toEqual([
                { id: 10, title: 'React Docs', url: 'https://react.dev', type: 'article', categoryId: 1 },
            ])
        })

        it('returneaza eroare cand query-ul esueaza', async () => {
            mockFrom(supabase.from, {
                learning_resources: { data: null, error: { message: 'boom' } },
            })

            const result = await getResourcesFromCategory(1)

            expect(result).toEqual({ success: false, message: 'boom', data: [] })
        })
    })

    describe('addResource', () => {
        it('valideaza titlul obligatoriu', async () => {
            const result = await addResource({ categoryId: 1, title: '   ' })

            expect(result).toEqual({ success: false, message: 'Please add title !' })
            expect(supabase.from).not.toHaveBeenCalled()
        })

        it('valideaza categoria obligatorie', async () => {
            const result = await addResource({ categoryId: 0, title: 'Ghid React' })

            expect(result).toEqual({ success: false, message: 'Missing category!' })
        })

        it('insereaza resursa cu valorile implicite pentru url si type', async () => {
            const created = { id: 3, title: 'Ghid React' }
            const queries = mockFrom(supabase.from, {
                learning_resources: { data: created, error: null },
            })

            const result = await addResource({ categoryId: 1, title: '  Ghid React  ' })

            expect(result).toEqual({ success: true, data: created, message: 'Resource was added!!' })
            expect(queries.learning_resources[0].insert).toHaveBeenCalledWith({
                category_id: 1,
                title: 'Ghid React',
                url: null,
                type: 'article',
            })
        })

        it('pastreaza url-ul si tipul primite', async () => {
            const queries = mockFrom(supabase.from, {
                learning_resources: { data: { id: 4 }, error: null },
            })

            await addResource({ categoryId: 2, title: 'Curs', url: 'https://x.dev', type: 'video' })

            expect(queries.learning_resources[0].insert).toHaveBeenCalledWith({
                category_id: 2,
                title: 'Curs',
                url: 'https://x.dev',
                type: 'video',
            })
        })

        it('returneaza eroarea din baza de date', async () => {
            mockFrom(supabase.from, {
                learning_resources: { data: null, error: { message: 'insert failed' } },
            })

            const result = await addResource({ categoryId: 1, title: 'Ghid' })

            expect(result).toEqual({ success: false, message: 'insert failed' })
        })
    })

    describe('updateCategory', () => {
        it('actualizeaza categoria si face trim la nume', async () => {
            const updated = { id: 1, name: 'Frontend Avansat' }
            const queries = mockFrom(supabase.from, { categories: { data: updated, error: null } })

            const result = await updateCategory({
                id: 1,
                name: '  Frontend Avansat  ',
                description: 'React 19',
                difficulty: 'HARD',
            })

            expect(result).toEqual({ success: true, data: updated, message: 'Updated category!' })
            expect(queries.categories[0].update).toHaveBeenCalledWith({
                name: 'Frontend Avansat',
                description: 'React 19',
                difficulty: 'HARD',
            })
            expect(queries.categories[0].eq).toHaveBeenCalledWith('id', 1)
        })

        it('foloseste null cand descrierea lipseste', async () => {
            const queries = mockFrom(supabase.from, { categories: { data: {}, error: null } })

            await updateCategory({ id: 1, name: 'X', difficulty: 'EASY' })

            expect(queries.categories[0].update).toHaveBeenCalledWith({
                name: 'X',
                description: null,
                difficulty: 'EASY',
            })
        })

        it('respinge numele gol', async () => {
            const result = await updateCategory({ id: 1, name: '   ', difficulty: 'EASY' })

            expect(result).toEqual({
                success: false,
                message: 'Please add the name of the category!',
            })
        })

        it('propaga eroarea de update', async () => {
            mockFrom(supabase.from, { categories: { data: null, error: { message: 'update failed' } } })

            const result = await updateCategory({ id: 1, name: 'X', difficulty: 'EASY' })

            expect(result).toEqual({ success: false, message: 'update failed' })
        })
    })

    describe('deleteCategory', () => {
        it('sterge categoria', async () => {
            const queries = mockFrom(supabase.from, { categories: { error: null } })

            const result = await deleteCategory(1)

            expect(result).toEqual({ success: true, message: 'Categorie ștearsă!' })
            expect(queries.categories[0].eq).toHaveBeenCalledWith('id', 1)
        })

        it('trateaza violarea de cheie straina (23503) cu mesaj dedicat', async () => {
            mockFrom(supabase.from, {
                categories: { error: { code: '23503', message: 'fk violation' } },
            })

            const result = await deleteCategory(1)

            expect(result).toEqual({
                success: false,
                message: "You can't delete this category, questions and tags are tied to it.",
            })
        })

        it('returneaza mesajul brut pentru alte erori', async () => {
            mockFrom(supabase.from, {
                categories: { error: { code: '500', message: 'server error' } },
            })

            const result = await deleteCategory(1)

            expect(result).toEqual({ success: false, message: 'server error' })
        })
    })

    describe('addTag', () => {
        it('adauga tagul cu numele curatat de spatii', async () => {
            const tag = { id: 10, category_id: 1, name: 'TypeScript' }
            const queries = mockFrom(supabase.from, { tags: { data: tag, error: null } })

            const result = await addTag({ categoryId: 1, name: ' TypeScript ' })

            expect(result).toEqual({ success: true, data: tag, message: 'Added tag!' })
            expect(queries.tags[0].insert).toHaveBeenCalledWith({ category_id: 1, name: 'TypeScript' })
        })

        it('respinge numele gol', async () => {
            const result = await addTag({ categoryId: 1, name: '   ' })

            expect(result).toEqual({ success: false, message: 'Tag Name is obligatory!' })
        })

        it('propaga eroarea de insert', async () => {
            mockFrom(supabase.from, { tags: { data: null, error: { message: 'duplicate' } } })

            const result = await addTag({ categoryId: 1, name: 'React' })

            expect(result).toEqual({ success: false, message: 'duplicate' })
        })
    })

    describe('updateTag', () => {
        it('actualizeaza tagul', async () => {
            const tag = { id: 3, name: 'Hooks' }
            const queries = mockFrom(supabase.from, { tags: { data: tag, error: null } })

            const result = await updateTag({ id: 3, name: ' Hooks ' })

            expect(result).toEqual({ success: true, data: tag, message: 'Tag updated!' })
            expect(queries.tags[0].update).toHaveBeenCalledWith({ name: 'Hooks' })
            expect(queries.tags[0].eq).toHaveBeenCalledWith('id', 3)
        })

        it('respinge numele gol', async () => {
            const result = await updateTag({ id: 3, name: '' })

            expect(result).toEqual({ success: false, message: 'Tag name is obligatory.' })
        })

        it('propaga eroarea de update', async () => {
            mockFrom(supabase.from, { tags: { data: null, error: { message: 'nope' } } })

            const result = await updateTag({ id: 3, name: 'Hooks' })

            expect(result).toEqual({ success: false, message: 'nope' })
        })
    })

    describe('deleteTag', () => {
        it('sterge tagul', async () => {
            const queries = mockFrom(supabase.from, { tags: { error: null } })

            const result = await deleteTag(5)

            expect(result).toEqual({ success: true, message: 'Tag deleted!' })
            expect(queries.tags[0].eq).toHaveBeenCalledWith('id', 5)
        })

        it('trateaza violarea de cheie straina (23503)', async () => {
            mockFrom(supabase.from, { tags: { error: { code: '23503', message: 'fk' } } })

            const result = await deleteTag(5)

            expect(result).toEqual({
                success: false,
                message: 'This tag cannot be deleted, questions are tied to it.',
            })
        })

        it('returneaza mesajul brut pentru alte erori', async () => {
            mockFrom(supabase.from, { tags: { error: { code: '42', message: 'other' } } })

            const result = await deleteTag(5)

            expect(result).toEqual({ success: false, message: 'other' })
        })
    })

    describe('addCategory', () => {
        it('adauga o categorie noua', async () => {
            const created = { id: 2, name: 'Backend' }
            const queries = mockFrom(supabase.from, { categories: { data: created, error: null } })

            const result = await addCategory({ name: ' Backend ', description: 'Node', difficulty: 'MEDIUM' })

            expect(result).toEqual({ success: true, data: created, message: 'Category added!' })
            expect(queries.categories[0].insert).toHaveBeenCalledWith({
                name: 'Backend',
                description: 'Node',
                difficulty: 'MEDIUM',
            })
        })

        it('foloseste null cand descrierea lipseste', async () => {
            const queries = mockFrom(supabase.from, { categories: { data: {}, error: null } })

            await addCategory({ name: 'Backend', difficulty: 'EASY' })

            expect(queries.categories[0].insert).toHaveBeenCalledWith({
                name: 'Backend',
                description: null,
                difficulty: 'EASY',
            })
        })

        it('respinge numele gol', async () => {
            const result = await addCategory({ name: '', difficulty: 'EASY' })

            expect(result).toEqual({
                success: false,
                message: 'Name of the category is obligatory.',
            })
        })

        it('propaga eroarea de insert', async () => {
            mockFrom(supabase.from, { categories: { data: null, error: { message: 'exists' } } })

            const result = await addCategory({ name: 'Backend', difficulty: 'EASY' })

            expect(result).toEqual({ success: false, message: 'exists' })
        })
    })

    describe('getQuestionsByCategory', () => {
        it('returneaza intrebarile categoriei', async () => {
            const questions = [{ id: 1, question_text: 'Ce este JSX?' }]
            const queries = mockFrom(supabase.from, { questions: { data: questions, error: null } })

            const result = await getQuestionsByCategory(1)

            expect(result).toEqual({ success: true, data: questions })
            expect(queries.questions[0].eq).toHaveBeenCalledWith('category_id', 1)
        })

        it('returneaza array gol cand data este null', async () => {
            mockFrom(supabase.from, { questions: { data: null, error: null } })

            const result = await getQuestionsByCategory(1)

            expect(result.data).toEqual([])
        })

        it('propaga eroarea', async () => {
            mockFrom(supabase.from, { questions: { data: null, error: { message: 'err' } } })

            const result = await getQuestionsByCategory(1)

            expect(result).toEqual({ success: false, message: 'err', data: [] })
        })
    })

    describe('getAllResources', () => {
        it('mapeaza resursele impreuna cu numele categoriei', async () => {
            mockFrom(supabase.from, {
                learning_resources: {
                    data: [
                        {
                            id: 1,
                            title: 'Ghid TS',
                            url: 'https://ts.com',
                            type: 'article',
                            category_id: 2,
                            categories: { name: 'TypeScript' },
                        },
                    ],
                    error: null,
                },
            })

            const result = await getAllResources()

            expect(result.success).toBe(true)
            expect(result.data).toEqual([
                { id: 1, title: 'Ghid TS', url: 'https://ts.com', type: 'article', category: 'TypeScript' },
            ])
        })

        it('aplica valori implicite pentru campurile lipsa', async () => {
            mockFrom(supabase.from, {
                learning_resources: {
                    data: [{ id: 2, title: null, url: null, type: null, categories: null }],
                    error: null,
                },
            })

            const result = await getAllResources()

            expect(result.data).toEqual([
                { id: 2, title: '', url: '', type: 'Resource', category: 'General' },
            ])
        })

        it('filtreaza dupa categorie cand primeste categoryId', async () => {
            const queries = mockFrom(supabase.from, {
                learning_resources: { data: [], error: null },
            })

            await getAllResources(7)

            expect(queries.learning_resources[0].eq).toHaveBeenCalledWith('category_id', 7)
        })

        it('propaga eroarea', async () => {
            mockFrom(supabase.from, {
                learning_resources: { data: null, error: { message: 'fail' } },
            })

            const result = await getAllResources()

            expect(result).toEqual({ success: false, message: 'fail', data: [] })
        })
    })

    describe('fetchAllResourcesWrapper', () => {
        it('returneaza doar array-ul de resurse', async () => {
            mockFrom(supabase.from, {
                learning_resources: {
                    data: [{ id: 1, title: 'A', url: 'u', type: 'article', categories: { name: 'C' } }],
                    error: null,
                },
            })

            const resources = await fetchAllResourcesWrapper()

            expect(resources).toEqual([
                { id: 1, title: 'A', url: 'u', type: 'article', category: 'C' },
            ])
        })

        it('returneaza array gol si logheaza eroarea cand fetch-ul esueaza', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            mockFrom(supabase.from, {
                learning_resources: { data: null, error: { message: 'fail' } },
            })

            const resources = await fetchAllResourcesWrapper()

            expect(resources).toEqual([])
            expect(consoleSpy).toHaveBeenCalled()
            consoleSpy.mockRestore()
        })
    })
})
