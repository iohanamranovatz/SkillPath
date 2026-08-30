import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    getCategories,
    addResource,
    deleteCategory,
    addCategory, getAllResources, deleteTag, addTag, getCategoryTags, updateCategory, updateTag, getQuestionsByCategory,
    getCategoryById, getResourcesFromCategory
} from '@/backend/categories'
import { supabase } from '@/helper/SupabaseClient'

// mock client
vi.mock('@/helper/SupabaseClient', () => ({
    default: {
        from: vi.fn(),
    },
    supabase: {
        from: vi.fn(),
    }
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('SkillPath Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getCategories', () => {
        it('ar trebui să returneze categoriile cu succes împreună cu numărul de exerciții', async () => {
            const dbResponse = [
                { id: 1, name: 'Frontend', description: 'React & Next.js', questions: [{ count: 5 }] }
            ]

            // Mocking the query chain: from -> select -> order
            const mockOrder = vi.fn().mockResolvedValueOnce({ data: dbResponse, error: null })
            const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
            vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

            const result = await getCategories()

            expect(result.success).toBe(true)
            expect(result.data).toEqual([
                { id: 1, name: 'Frontend', description: 'React & Next.js', exerciseCount: 5 }
            ])
        })

        it('ar trebui să gestioneze erorile de bază de date cu grație', async () => {
            const mockOrder = vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Eșec conexiune baza de date' } })
            const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
            vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

            const result = await getCategories()

            expect(result.success).toBe(false)
            expect(result.message).toBe('Eșec conexiune baza de date')
            expect(result.data).toEqual([])
        })
    })

    describe('addResource validation', () => {
        it('ar trebui să eșueze dacă titlul este lipsit sau gol', async () => {
            const result = await addResource({ tagId: 1, title: '   ' })

            expect(result.success).toBe(false)
            expect(result.message).toBe('Titlul este obligatoriu.')
        })

        it('ar trebui să eșueze dacă tagId lipsește', async () => {
            const result = await addResource({ tagId: 0, title: 'Ghid React' })

            expect(result.success).toBe(false)
            expect(result.message).toBe('Alege un tag pentru resursă.')
        })
    })

    describe('deleteCategory constraints', () => {
        it('ar trebui să gestioneze codul de eroare pentru constrângere de cheie străină (23503)', async () => {
            // Mocking the query chain: from -> delete -> eq
            const mockEq = vi.fn().mockResolvedValueOnce({
                error: { code: '23503', message: 'violates foreign key constraint' }
            })
            const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
            vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any)

            const result = await deleteCategory(1)

            expect(result.success).toBe(false)
            expect(result.message).toBe('Nu poți șterge categoria: are taguri sau întrebări asociate.')
        })
    })

    describe('addCategory', () => {
        it('ar trebui să adauge o categorie nouă cu succes', async () => {
            const newCategory = { id: 2, name: 'Backend', description: 'Node.js & Supabase' }

            // Mocking the query chain: from -> insert -> select -> single
            const mockSingle = vi.fn().mockResolvedValueOnce({ data: newCategory, error: null })
            const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
            const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
            vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

            const result = await addCategory({ name: 'Backend', description: 'Node.js & Supabase' })

            expect(result.success).toBe(true)
            expect(result.data).toEqual(newCategory)
            expect(result.message).toBe('Categorie adăugată!')
        })

        it('ar trebui să valideze că numele categoriei este obligatoriu', async () => {
            const result = await addCategory({ name: '' })

            expect(result.success).toBe(false)
            expect(result.message).toBe('Numele categoriei este obligatoriu.')
        })
    })
})

describe('getCategoryTags', () => {
    it('ar trebui să returneze tagurile unei categorii ordonate alfabetic', async () => {
        const mockTags = [
            { id: 1, name: 'React' },
            { id: 2, name: 'Next.js' }
        ]

        const mockOrder = vi.fn().mockResolvedValueOnce({ data: mockTags, error: null })
        const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

        const result = await getCategoryTags(1)

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockTags)
        expect(supabase.from).toHaveBeenCalledWith('tags')
        expect(mockEq).toHaveBeenCalledWith('category_id', 1)
    })

    it('ar trebui să gestioneze eroarea când preluarea tagurilor eșuează', async () => {
        const mockOrder = vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Eroare la taguri' } })
        const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

        const result = await getCategoryTags(1)

        expect(result.success).toBe(false)
        expect(result.message).toBe('Eroare la taguri')
        expect(result.data).toEqual([])
    })
})

describe('addTag', () => {
    it('ar trebui să adauge un tag nou cu succes', async () => {
        const newTag = { id: 10, category_id: 1, name: 'TypeScript' }

        const mockSingle = vi.fn().mockResolvedValueOnce({ data: newTag, error: null })
        const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
        const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
        vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

        const result = await addTag({ categoryId: 1, name: ' TypeScript ' })

        expect(result.success).toBe(true)
        expect(result.data).toEqual(newTag)
        expect(result.message).toBe('Tag adăugat!')
        // Verificăm că numele a fost trimis curățat de spații (trim)
        expect(mockInsert).toHaveBeenCalledWith({ category_id: 1, name: 'TypeScript' })
    })

    it('ar trebui să eșueze dacă numele tagului este gol', async () => {
        const result = await addTag({ categoryId: 1, name: '   ' })

        expect(result.success).toBe(false)
        expect(result.message).toBe('Numele tagului este obligatoriu.')
    })
})

describe('deleteTag', () => {
    it('ar trebui să ștergă un tag cu succes', async () => {
        const mockEq = vi.fn().mockResolvedValueOnce({ error: null })
        const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
        vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any)

        const result = await deleteTag(5)

        expect(result.success).toBe(true)
        expect(result.message).toBe('Tag șters!')
        expect(mockEq).toHaveBeenCalledWith('id', 5)
    })

    it('ar trebui să gestioneze eroarea de constrângere de cheie străină (23503) la ștergerea tagului', async () => {
        const mockEq = vi.fn().mockResolvedValueOnce({
            error: { code: '23503', message: 'foreign key violation' }
        })
        const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
        vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any)

        const result = await deleteTag(5)

        expect(result.success).toBe(false)
        expect(result.message).toBe('Nu poți șterge tagul: are resurse sau întrebări asociate.')
    })
})

describe('getAllResources', () => {
    it('ar trebui să returneze toate resursele mapate corect cu numele tagului', async () => {
        const dbResources = [
            { id: 1, title: 'Ghid TS', url: 'https://ts.com', type: 'article', tag_id: 2, tags: { name: 'TypeScript' } }
        ]

        const mockOrder = vi.fn().mockResolvedValueOnce({ data: dbResources, error: null })
        const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

        const result = await getAllResources()

        expect(result.success).toBe(true)
        expect(result.data).toEqual([
            { id: 1, title: 'Ghid TS', url: 'https://ts.com', type: 'article', tag: 'TypeScript' }
        ])
    })

    it('ar trebui să gestioneze fallback-ul pentru valori nule și erori', async () => {
        const dbResources = [
            { id: 2, title: null, url: null, type: null, tag_id: 2, tags: null }
        ]

        const mockOrder = vi.fn().mockResolvedValueOnce({ data: dbResources, error: null })
        const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

        const result = await getAllResources()

        expect(result.success).toBe(true)
        expect(result.data).toEqual([
            { id: 2, title: '', url: '', type: 'Resource', tag: 'General' }
        ])
    })
})

// describe('updateCategory', () => {
//     it('ar trebui să actualizeze categoria cu succes', async () => {
//         const updatedCategory = { id: 1, name: 'Frontend Avansat', description: 'React 19 & Next.js' }
//
//         const mockSingle = vi.fn().mockResolvedValueOnce({ data: updatedCategory, error: null })
//         const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
//         const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
//         const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
//         vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)
//
//         const result = await updateCategory({ id: 1, name: ' Frontend Avansat ', description: 'React 19 & Next.js' })
//
//         expect(result.success).toBe(true)
//         expect(result.data).toEqual(updatedCategory)
//         expect(result.message).toBe('Categorie actualizată!')
//         expect(mockUpdate).toHaveBeenCalledWith({ name: 'Frontend Avansat', description: 'React 19 & Next.js' })
//         expect(mockEq).toHaveBeenCalledWith('id', 1)
//     })
//
//     it('ar trebui să eșueze dacă numele categoriei este gol la actualizare', async () => {
//         const result = await updateCategory({ id: 1, name: '   ', description: 'Test' })
//
//         expect(result.success).toBe(false)
//         expect(result.message).toBe('Numele categoriei este obligatoriu.')
//     })
//
//     it('ar trebui să gestioneze erorile venite de la baza de date la update', async () => {
//         const mockSingle = vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Eroare la update' } })
//         const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
//         const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
//         const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
//         vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)
//
//         const result = await updateCategory({ id: 1, name: 'Noua Categorie' })
//
//         expect(result.success).toBe(false)
//         expect(result.message).toBe('Eroare la update')
//     })
// })

// describe('updateTag', () => {
//     it('ar trebui să actualizeze tagul cu succes', async () => {
//         const updatedTag = { id: 3, category_id: 1, name: 'Hooks' }
//
//         const mockSingle = vi.fn().mockResolvedValueOnce({ data: updatedTag, error: null })
//         const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
//         const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
//         const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
//         vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)
//
//         const result = await updateTag({ id: 3, name: ' Hooks ' })
//
//         expect(result.success).toBe(true)
//         expect(result.data).toEqual(updatedTag)
//         expect(result.message).toBe('Tag actualizat!')
//         expect(mockUpdate).toHaveBeenCalledWith({ name: 'Hooks' })
//         expect(mockEq).toHaveBeenCalledWith('id', 3)
//     })
//
//     it('ar trebui să eșueze dacă numele tagului este gol la actualizare', async () => {
//         const result = await updateTag({ id: 3, name: '' })
//
//         expect(result.success).toBe(false)
//         expect(result.message).toBe('Numele tagului este obligatoriu.')
//     })
// })

describe('getCategoryById & getResources & getQuestionsByCategory', () => {
    it('getCategoryById: ar trebui să returneze o categorie după ID', async () => {
        const mockCategory = { id: 1, name: 'Frontend', description: 'React' }

        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockCategory, error: null })
                })
            })
        } as any)

        const result = await getCategoryById(1)

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockCategory)
    })

    it('getResources: ar trebui să preia resursele pentru o categorie/tag', async () => {
        const mockDbResources = [
            {
                id: 10,
                title: 'React Docs',
                url: 'https://react.dev',
                type: 'article',
                tag_id: 2,
                tags: { name: 'React' }
            }
        ]

        const mockOrder = vi.fn().mockResolvedValue({ data: mockDbResources, error: null })
        const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: mockEq
            })
        } as any)

        const result = await getResourcesFromCategory(1)

        expect(result.success).toBe(true)
        expect(result.data).toEqual([
            {
                id: 10,
                title: 'React Docs',
                url: 'https://react.dev',
                type: 'article',
                tagId: 2,
                tagName: 'React'
            }
        ])
    })

    it('getQuestionsByCategory: ar trebui să preia întrebările unei categorii', async () => {
        const mockQuestions = [{ id: 1, question_text: 'Ce este JSX?' }]

        const mockOrder = vi.fn().mockResolvedValue({ data: mockQuestions, error: null })
        const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: mockEq
            })
        } as any)

        const result = await getQuestionsByCategory(1)

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockQuestions)
    })
})
