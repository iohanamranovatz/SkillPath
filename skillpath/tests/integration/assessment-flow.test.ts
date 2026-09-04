import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateAssessment } from '@/backend/user/generateAssessment'
import { saveSingleAnswer } from '@/backend/user/saveProgressAssessment'
import { submitAssessment } from '@/backend/user/submitAssessment'
import { getTests } from '@/backend/user/getTests'
import { createClient } from '@/helper/supabase/server'

/**
 * Test de integrare pentru fluxul complet al unui test:
 *   generateAssessment -> saveSingleAnswer -> submitAssessment -> evaluateUserLevel
 *
 * Spre deosebire de testele unitare, aici NU se mock-uieste niciun modul de
 * backend: modulele se apeleaza intre ele exact ca in productie. Singura
 * granita mock-uita este baza de date, inlocuita cu un store in memorie.
 */

vi.mock('@/helper/supabase/server', () => {
    const client = { from: vi.fn() }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
type Row = Record<string, any>

// --- baza de date in memorie -------------------------------------------------

function createDatabase(seed: Record<string, Row[]>) {
    const tables: Record<string, Row[]> = JSON.parse(JSON.stringify(seed))
    let nextId = 1000

    // Reconstruieste relatiile cerute prin sintaxa de join a Supabase
    // (ex: "assessment_answers ( questions ( category_id ) )").
    function hydrate(table: string, rows: Row[], select: string): Row[] {
        const wants = (name: string) => select.includes(name)

        const withQuestion = (answer: Row) => {
            if (!wants('questions')) return answer
            const question = tables.questions?.find((q) => q.id === answer.question_id) ?? null
            const enriched = question ? { ...question } : null
            if (enriched && wants('categories')) {
                enriched.categories =
                    tables.categories?.find((c) => c.id === enriched.category_id) ?? null
            }
            return { ...answer, questions: enriched }
        }

        if (table === 'assessments' && wants('assessment_answers')) {
            return rows.map((assessment) => ({
                ...assessment,
                assessment_answers: (tables.assessment_answers ?? [])
                    .filter((a) => a.assessment_id === assessment.id)
                    .map(withQuestion),
            }))
        }

        if (table === 'assessment_answers') {
            return rows.map(withQuestion)
        }

        if (table === 'questions' && wants('categories')) {
            return rows.map((q) => ({
                ...q,
                categories: tables.categories?.find((c) => c.id === q.category_id) ?? null,
            }))
        }

        return rows
    }

    function query(table: string) {
        const filters: [string, any][] = []
        let inFilter: [string, any[]] | null = null
        let operation: 'select' | 'insert' | 'update' | 'delete' = 'select'
        let payload: any = null
        let selectStr = ''

        const matches = (row: Row) =>
            filters.every(([col, value]) => String(row[col]) === String(value)) &&
            (!inFilter || inFilter[1].map(String).includes(String(row[inFilter[0]])))

        const run = () => {
            const rows = tables[table] ?? (tables[table] = [])

            if (operation === 'insert') {
                const inserted = (Array.isArray(payload) ? payload : [payload]).map((row) => ({
                    id: row.id ?? nextId++,
                    ...row,
                }))
                rows.push(...inserted)
                return { data: inserted, error: null }
            }

            if (operation === 'update') {
                const updated = rows.filter(matches)
                updated.forEach((row) => Object.assign(row, payload))
                return { data: updated, error: null }
            }

            if (operation === 'delete') {
                const kept = rows.filter((row) => !matches(row))
                const removed = rows.length - kept.length
                tables[table] = kept
                return { data: null, error: null, count: removed }
            }

            return { data: hydrate(table, rows.filter(matches), selectStr), error: null }
        }

        const builder: any = {
            select: (columns = '') => {
                selectStr = columns
                return builder
            },
            order: () => builder,
            limit: () => builder,
            eq: (col: string, value: any) => {
                filters.push([col, value])
                return builder
            },
            in: (col: string, values: any[]) => {
                inFilter = [col, values]
                return builder
            },
            insert: (rows: any) => {
                operation = 'insert'
                payload = rows
                return builder
            },
            update: (values: any) => {
                operation = 'update'
                payload = values
                return builder
            },
            delete: () => {
                operation = 'delete'
                return builder
            },
            single: () => {
                const res = run()
                return Promise.resolve({
                    data: res.data?.[0] ?? null,
                    error: res.data?.length ? null : { message: 'not found' },
                })
            },
            then: (resolve: any, reject: any) => Promise.resolve(run()).then(resolve, reject),
        }

        return builder
    }

    return { tables, query }
}

// --- date de start -----------------------------------------------------------

function seedQuestions() {
    return {
        users: [{ id: 5, name: 'Ana', estimated_level: 'Beginner' }],
        categories: [{ id: 1, name: 'Frontend' }],
        questions: [
            { id: 1, category_id: 1, is_active: true, question_text: 'Q1', difficulty: 'EASY', correct_answer: 'a', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
            { id: 2, category_id: 1, is_active: true, question_text: 'Q2', difficulty: 'EASY', correct_answer: 'b', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
            { id: 3, category_id: 1, is_active: true, question_text: 'Q3', difficulty: 'MEDIUM', correct_answer: 'a', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
            { id: 4, category_id: 1, is_active: true, question_text: 'Q4', difficulty: 'HARD', correct_answer: 'b', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
            // inactiva -> nu trebuie sa intre in test
            { id: 5, category_id: 1, is_active: false, question_text: 'Q5', difficulty: 'EASY', correct_answer: 'a', options: [] },
        ],
        assessments: [],
        assessment_answers: [],
    }
}

describe('flux complet de evaluare', () => {
    let db: ReturnType<typeof createDatabase>

    beforeEach(() => {
        vi.clearAllMocks()
        db = createDatabase(seedQuestions())
        vi.mocked(supabase.from).mockImplementation((table: string) => db.query(table))
    })

    it('genereaza testul, salveaza progresul, il trimite si actualizeaza nivelul', async () => {
        // 1. generarea testului: doar intrebarile active ale categoriei
        const generated = await generateAssessment(5, 1)

        expect(generated.success).toBe(true)
        const { assessmentId, questions } = generated.data!
        expect(questions).toHaveLength(4)
        expect(questions.map((q) => q.id).sort()).toEqual([1, 2, 3, 4])

        // testul este creat in starea "in progress", cu raspunsuri goale
        const assessment = db.tables.assessments.find((a) => a.id === assessmentId)
        expect(assessment!.status).toBe('in_progress')
        expect(db.tables.assessment_answers).toHaveLength(4)
        expect(db.tables.assessment_answers.every((a) => a.selected_option_id === null)).toBe(true)

        // 2. auto-save pe o intrebare, inainte de trimitere
        const saved = await saveSingleAnswer(assessmentId, 1, 'a')
        expect(saved.success).toBe(true)
        expect(
            db.tables.assessment_answers.find((a) => a.question_id === 1)!.selected_option_id
        ).toBe('a')

        // testul in desfasurare apare in lista userului
        const inProgress = await getTests(5)
        expect(inProgress.data![0]).toMatchObject({
            id: assessmentId,
            status: 'in_progress',
            score: null,
            notAnswered: 1,
        })

        // 3. trimiterea testului: 3 din 4 raspunsuri corecte
        const submitted = await submitAssessment(assessmentId, [
            { questionId: 1, optionId: 'a' }, // corect
            { questionId: 2, optionId: 'b' }, // corect
            { questionId: 3, optionId: 'a' }, // corect
            { questionId: 4, optionId: 'a' }, // gresit
        ])

        expect(submitted.success).toBe(true)
        expect(submitted.data).toMatchObject({ correct: 3, total: 4, scorePct: 75 })
        expect(submitted.data!.perCategory).toEqual([
            { category: 'Frontend', score: 75, correct: 3, total: 4 },
        ])

        // corectitudinea fiecarui raspuns a fost persistata
        const answers = db.tables.assessment_answers
        expect(answers.filter((a) => a.is_correct === true)).toHaveLength(3)
        expect(answers.find((a) => a.question_id === 4)!.is_correct).toBe(false)

        // testul este marcat finalizat, cu scorul salvat
        const finished = db.tables.assessments.find((a) => a.id === assessmentId)
        expect(finished).toMatchObject({ status: 'completed', score_total: 75 })

        // 4. nivelul userului a fost reevaluat: un singur test trecut -> Beginner
        expect(submitted.data!.level).toBe('Beginner')
        expect(db.tables.users[0].estimated_level).toBe('Beginner')

        // testul apare acum ca finalizat, cu scor
        const afterSubmit = await getTests(5)
        expect(afterSubmit.data![0]).toMatchObject({ status: 'completed', score: 75 })
    })

    it('promoveaza userul la Intermediate dupa 4 teste trecute in 4 categorii', async () => {
        // pregatim 4 categorii cu cate o intrebare activa fiecare
        db = createDatabase({
            users: [{ id: 5, name: 'Ana', estimated_level: 'Beginner' }],
            categories: [1, 2, 3, 4].map((id) => ({ id, name: `Cat${id}` })),
            questions: [1, 2, 3, 4].map((id) => ({
                id,
                category_id: id,
                is_active: true,
                question_text: `Q${id}`,
                difficulty: 'EASY',
                correct_answer: 'a',
                options: [{ id: 'a', text: 'A' }],
            })),
            assessments: [],
            assessment_answers: [],
        })
        vi.mocked(supabase.from).mockImplementation((table: string) => db.query(table))

        let lastLevel: string | null = null
        for (const categoryId of [1, 2, 3, 4]) {
            const generated = await generateAssessment(5, categoryId)
            const { assessmentId, questions } = generated.data!

            const result = await submitAssessment(
                assessmentId,
                questions.map((q) => ({ questionId: q.id, optionId: 'a' }))
            )
            lastLevel = result.data!.level
        }

        expect(lastLevel).toBe('Intermediate')
        expect(db.tables.users[0].estimated_level).toBe('Intermediate')
    })

    it('nu creeaza test cand categoria nu are intrebari active', async () => {
        const generated = await generateAssessment(5, 99)

        expect(generated).toEqual({ success: false, message: 'Sorry, no questions found!', data: null })
        expect(db.tables.assessments).toHaveLength(0)
    })
})
