import { vi } from 'vitest'

export type QueryResult = { data?: any; error?: any; count?: number }

/**
 * Builds an object that mimics a Supabase query builder.
 *
 * Any method called on it (.select, .eq, .in, .order, .single, .limit ...)
 * returns the same object, so the chain can have any length and any order.
 * When awaited, it resolves with `result`.
 *
 * Every method is a spy, so assertions like this work:
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
 * Configures `supabase.from` so that every table answers with a predefined
 * result.
 *
 * - a plain value -> returned on every call for that table
 * - an array      -> a queue of responses, in call order
 *
 * Returns a table -> list of created queries dictionary, for assertions.
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
