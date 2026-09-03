import { vi } from 'vitest'

export type QueryResult = { data?: any; error?: any; count?: number }

/**
 * Construieste un obiect care imita un query builder Supabase.
 *
 * Orice metoda apelata pe el (.select, .eq, .in, .order, .single, .limit ...)
 * returneaza acelasi obiect, deci lantul poate avea orice lungime si orice
 * ordine. Cand este asteptat cu `await`, se rezolva cu `result`.
 *
 * Fiecare metoda este un spy, asa ca se poate verifica:
 *   expect(query.eq).toHaveBeenCalledWith('id', 5)
 */
export function createQuery(result: QueryResult = { data: null, error: null }) {
    const spies: Record<string | symbol, any> = {}
    const promise = Promise.resolve(result)

    const proxy: any = new Proxy(promise, {
        get(target: any, prop) {
            if (prop === 'then' || prop === 'catch' || prop === 'finally') {
                return target[prop].bind(target)
            }
            if (!spies[prop]) {
                spies[prop] = vi.fn(() => proxy)
            }
            return spies[prop]
        },
    })

    return proxy
}

/**
 * Configureaza `supabase.from` astfel incat fiecare tabel sa raspunda cu un
 * rezultat prestabilit.
 *
 * - o valoare simpla  -> se returneaza la fiecare apel pe acel tabel
 * - un array          -> coada de raspunsuri, in ordinea apelurilor
 *
 * Returneaza un dictionar tabel -> lista de query-uri create, pentru assert-uri.
 */
export function mockFrom(
    from: any,
    tables: Record<string, QueryResult | QueryResult[]>
): Record<string, any[]> {
    const created: Record<string, any[]> = {}

    vi.mocked(from).mockImplementation((table: string) => {
        const spec = tables[table]
        let result: QueryResult

        if (Array.isArray(spec)) {
            result = spec.length > 1 ? spec.shift()! : (spec[0] ?? { data: null, error: null })
        } else {
            result = spec ?? { data: null, error: null }
        }

        const query = createQuery(result)
        created[table] = created[table] ?? []
        created[table].push(query)
        return query
    })

    return created
}
