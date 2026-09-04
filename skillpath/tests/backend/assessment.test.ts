import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateAssessment } from '@/backend/user/generateAssessment'
import { saveSingleAnswer } from '@/backend/user/saveProgressAssessment'
import { submitAssessment } from '@/backend/user/submitAssessment'
import { getTests } from '@/backend/user/getTests'
import { createClient } from '@/helper/supabase/server'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/supabase/server', () => {
    const client = { from: vi.fn() }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
vi.mock('@/backend/user/evaluateUserLevel', () => ({
    evaluateUserLevel: vi.fn(),
}))

// modulul este mock-uit mai sus, deci importul returneaza spy-ul
import { evaluateUserLevel } from '@/backend/user/evaluateUserLevel'

const QUESTIONS = [
    { id: 1, question_text: 'Ce este JSX?', difficulty: 'EASY', options: [{ id: 'a', text: 'A' }] },
    { id: 2, question_text: 'Ce este un hook?', difficulty: 'MEDIUM', options: null },
]

describe('backend/user/generateAssessment', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it.each([
        ['userId', 0, 1],
        ['categoryId', 1, 0],
    ])('respinge cererea cand lipseste %s', async (_field, userId, categoryId) => {
        const result = await generateAssessment(userId, categoryId)

        expect(result).toEqual({ success: false, message: 'Please fill all the fields!', data: null })
        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('creeaza testul si randurile de raspuns goale', async () => {
        // amestecarea intrebarilor foloseste Math.random; il fixam ca ordinea sa fie stabila
        vi.spyOn(Math, 'random').mockReturnValue(0.5)
        const queries = mockFrom(supabase.from, {
            questions: { data: QUESTIONS, error: null },
            assessments: { data: { id: 77 }, error: null },
            assessment_answers: { error: null },
        })

        const result = await generateAssessment(5, 3)

        expect(result.success).toBe(true)
        expect(result.data!.assessmentId).toBe(77)
        expect(result.data!.questions).toHaveLength(2)
        // optiunile care nu sunt array devin lista goala
        expect(result.data!.questions.map((q) => q.options.length).sort()).toEqual([0, 1])

        expect(queries.questions[0].eq).toHaveBeenCalledWith('category_id', 3)
        expect(queries.questions[0].eq).toHaveBeenCalledWith('is_active', true)
        expect(queries.assessments[0].insert).toHaveBeenCalledWith(
            expect.objectContaining({ user_id: 5, status: 'in_progress' })
        )
        expect(queries.assessment_answers[0].insert).toHaveBeenCalledWith([
            { assessment_id: 77, question_id: 1, selected_option_id: null, is_correct: null },
            { assessment_id: 77, question_id: 2, selected_option_id: null, is_correct: null },
        ])
    })

    it('limiteaza testul la 10 intrebari', async () => {
        const many = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            question_text: `Q${i + 1}`,
            difficulty: 'EASY',
            options: [],
        }))
        mockFrom(supabase.from, {
            questions: { data: many, error: null },
            assessments: { data: { id: 1 }, error: null },
            assessment_answers: { error: null },
        })

        const result = await generateAssessment(5, 3)

        expect(result.data!.questions).toHaveLength(10)
    })

    it('propaga eroarea la preluarea intrebarilor', async () => {
        mockFrom(supabase.from, { questions: { data: null, error: { message: 'no questions table' } } })

        const result = await generateAssessment(5, 3)

        expect(result).toEqual({ success: false, message: 'no questions table', data: null })
    })

    it('semnaleaza cand categoria nu are intrebari active', async () => {
        mockFrom(supabase.from, { questions: { data: [], error: null } })

        const result = await generateAssessment(5, 3)

        expect(result).toEqual({ success: false, message: 'Sorry, no questions found!', data: null })
    })

    it('returneaza eroare cand testul nu poate fi creat', async () => {
        mockFrom(supabase.from, {
            questions: { data: QUESTIONS, error: null },
            assessments: { data: null, error: { message: 'insert refuzat' } },
        })

        const result = await generateAssessment(5, 3)

        expect(result).toEqual({ success: false, message: 'insert refuzat', data: null })
    })

    it('foloseste un mesaj implicit cand insert-ul nu returneaza nici date, nici eroare', async () => {
        mockFrom(supabase.from, {
            questions: { data: QUESTIONS, error: null },
            assessments: { data: null, error: null },
        })

        const result = await generateAssessment(5, 3)

        expect(result.message).toBe('Nu s-a putut crea testul.')
    })

    it('sterge testul creat daca inserarea raspunsurilor esueaza', async () => {
        const queries = mockFrom(supabase.from, {
            questions: { data: QUESTIONS, error: null },
            assessments: [{ data: { id: 77 }, error: null }, { error: null }],
            assessment_answers: { error: { message: 'answers failed' } },
        })

        const result = await generateAssessment(5, 3)

        expect(result).toEqual({ success: false, message: 'answers failed', data: null })
        expect(queries.assessments[1].delete).toHaveBeenCalled()
        expect(queries.assessments[1].eq).toHaveBeenCalledWith('id', 77)
    })
})

describe('backend/user/saveSingleAnswer', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('salveaza raspunsul selectat pentru intrebare', async () => {
        const queries = mockFrom(supabase.from, { assessment_answers: { error: null } })

        const result = await saveSingleAnswer(77, 2, 'b')

        expect(result).toEqual({ success: true })
        expect(queries.assessment_answers[0].update).toHaveBeenCalledWith({ selected_option_id: 'b' })
        expect(queries.assessment_answers[0].eq).toHaveBeenCalledWith('assessment_id', 77)
        expect(queries.assessment_answers[0].eq).toHaveBeenCalledWith('question_id', 2)
    })

    it('raporteaza esecul de auto-save', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockFrom(supabase.from, { assessment_answers: { error: { message: 'offline' } } })

        const result = await saveSingleAnswer(77, 2, 'b')

        expect(result).toEqual({ success: false, message: 'offline' })
        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
    })
})

describe('backend/user/submitAssessment', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(evaluateUserLevel).mockResolvedValue({
            success: true,
            data: { level: 'Intermediate', qualified: 4, distinctCats: 4 },
        } as any)
    })

    const questions = [
        { id: 1, correct_answer: 'a', category_id: 1, categories: { name: 'Frontend' } },
        { id: 2, correct_answer: 'b', category_id: 1, categories: { name: 'Frontend' } },
        { id: 3, correct_answer: 'c', category_id: 2, categories: { name: 'Backend' } },
    ]

    it.each([
        ['id-ul testului lipseste', 0, [{ questionId: 1, optionId: 'a' }]],
        ['nu exista raspunsuri', 77, []],
    ])('respinge trimiterea cand %s', async (_case, id, answers) => {
        const result = await submitAssessment(id, answers)

        expect(result).toEqual({ success: false, message: 'Test invalid.', data: null })
    })

    it('calculeaza scorul total si scorul pe categorii', async () => {
        const queries = mockFrom(supabase.from, {
            questions: { data: questions, error: null },
            assessment_answers: { error: null },
            assessments: [{ error: null }, { data: { user_id: 7 }, error: null }],
        })

        const result = await submitAssessment(77, [
            { questionId: 1, optionId: 'a' }, // corect
            { questionId: 2, optionId: 'x' }, // gresit
            { questionId: 3, optionId: 'c' }, // corect
        ])

        expect(result.success).toBe(true)
        expect(result.data).toMatchObject({
            correct: 2,
            total: 3,
            scorePct: 67,
            level: 'Intermediate',
        })
        expect(result.data!.perCategory).toEqual([
            { category: 'Frontend', score: 50, correct: 1, total: 2 },
            { category: 'Backend', score: 100, correct: 1, total: 1 },
        ])
        // fiecare raspuns este salvat individual
        expect(queries.assessment_answers).toHaveLength(3)
        expect(queries.assessment_answers[0].update).toHaveBeenCalledWith({
            selected_option_id: 'a',
            is_correct: true,
        })
        // testul este marcat finalizat cu scorul procentual
        expect(queries.assessments[0].update).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'completed', score_total: 67 })
        )
        expect(evaluateUserLevel).toHaveBeenCalledWith(7)
    })

    it('grupeaza sub "Necunoscut" intrebarile care nu mai exista', async () => {
        mockFrom(supabase.from, {
            questions: { data: [], error: null },
            assessment_answers: { error: null },
            assessments: [{ error: null }, { data: null, error: null }],
        })

        const result = await submitAssessment(77, [{ questionId: 999, optionId: 'a' }])

        expect(result.data!.perCategory).toEqual([
            { category: 'Necunoscut', score: 0, correct: 0, total: 1 },
        ])
        // fara proprietar identificat, nivelul nu este reevaluat
        expect(result.data!.level).toBeNull()
        expect(evaluateUserLevel).not.toHaveBeenCalled()
    })

    it('propaga eroarea la preluarea intrebarilor', async () => {
        mockFrom(supabase.from, { questions: { data: null, error: { message: 'fetch failed' } } })

        const result = await submitAssessment(77, [{ questionId: 1, optionId: 'a' }])

        expect(result).toEqual({ success: false, message: 'fetch failed', data: null })
    })
})

describe('backend/user/getTests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('mapeaza testele cu categorii si progres', async () => {
        const queries = mockFrom(supabase.from, {
            assessments: {
                data: [
                    {
                        id: 1,
                        status: 'completed',
                        score_total: 80,
                        started_at: '2026-09-01T10:00:00.000Z',
                        completed_at: '2026-09-01T10:20:00.000Z',
                        assessment_answers: [
                            { selected_option_id: 'a', questions: { difficulty: 'EASY', categories: { name: 'Frontend' } } },
                            { selected_option_id: 'b', questions: { difficulty: 'HARD', categories: { name: 'Frontend' } } },
                        ],
                    },
                    {
                        id: 2,
                        status: 'in_progress',
                        score_total: 40,
                        started_at: '2026-09-02T10:00:00.000Z',
                        completed_at: null,
                        assessment_answers: [
                            { selected_option_id: null, questions: { difficulty: 'EASY', categories: null } },
                        ],
                    },
                ],
                error: null,
            },
        })

        const result = await getTests(5)

        expect(result.succes).toBe(true)
        expect(result.data![0]).toEqual({
            id: 1,
            categories: ['Frontend'],
            questions: 2,
            notAnswered: 2,
            score: 80,
            status: 'completed',
            startedAt: '2026-09-01T10:00:00.000Z',
            completedAt: '2026-09-01T10:20:00.000Z',
            progress: '20%',
        })
        // testul neterminat nu are scor afisat
        expect(result.data![1]).toMatchObject({ categories: [], score: null, notAnswered: 0 })
        expect(queries.assessments[0].eq).toHaveBeenCalledWith('user_id', 5)
    })

    it('trateaza testele fara raspunsuri', async () => {
        mockFrom(supabase.from, {
            assessments: {
                data: [{ id: 3, status: 'in_progress', started_at: null, completed_at: null }],
                error: null,
            },
        })

        const result = await getTests(5)

        expect(result.data![0]).toMatchObject({ questions: 0, notAnswered: 0, categories: [] })
    })

    it('returneaza eroarea din baza de date', async () => {
        mockFrom(supabase.from, { assessments: { data: null, error: { message: 'boom' } } })

        const result = await getTests(5)

        expect(result).toEqual({ succes: false, message: 'boom', data: [] })
    })
})
