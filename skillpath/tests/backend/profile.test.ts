import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    addObjective,
    toggleObjective,
    deleteObjective,
    toggleInterestTag,
} from '@/backend/user/profile/profileActions'
import { updateProfile } from '@/backend/user/profile/updateProfile'
import { createClient } from '@/helper/supabase/server'
import { revalidatePath } from 'next/cache'
import { mockFrom } from '../helpers/supabaseMock'

vi.mock('@/helper/supabase/server', () => {
    const client = { from: vi.fn(), auth: { getUser: vi.fn() } }
    return { default: client, supabase: client, createClient: () => client }
})


const supabase = createClient() as any
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('backend/user/profile/profileActions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('addObjective', () => {
        it('insereaza obiectivul si invalideaza pagina de profil', async () => {
            const queries = mockFrom(supabase.from, { user_objectives: { error: null } })

            await addObjective(5, 'Invat TypeScript')

            expect(queries.user_objectives[0].insert).toHaveBeenCalledWith({
                user_id: 5,
                title: 'Invat TypeScript',
                is_completed: false,
            })
            expect(revalidatePath).toHaveBeenCalledWith('/profile')
        })

        it('ignora titlurile goale', async () => {
            await addObjective(5, '   ')

            expect(supabase.from).not.toHaveBeenCalled()
            expect(revalidatePath).not.toHaveBeenCalled()
        })

        it('nu invalideaza pagina daca insert-ul esueaza', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            mockFrom(supabase.from, { user_objectives: { error: { message: 'nope' } } })

            await addObjective(5, 'Invat Go')

            expect(consoleSpy).toHaveBeenCalled()
            expect(revalidatePath).not.toHaveBeenCalled()
            consoleSpy.mockRestore()
        })
    })

    describe('toggleObjective', () => {
        it.each([
            [true, false],
            [false, true],
        ])('inverseaza starea din %s in %s', async (current, expected) => {
            const queries = mockFrom(supabase.from, { user_objectives: { error: null } })

            await toggleObjective(9, current)

            expect(queries.user_objectives[0].update).toHaveBeenCalledWith({ is_completed: expected })
            expect(queries.user_objectives[0].eq).toHaveBeenCalledWith('id', 9)
            expect(revalidatePath).toHaveBeenCalledWith('/profile')
        })
    })

    describe('deleteObjective', () => {
        it('sterge obiectivul', async () => {
            const queries = mockFrom(supabase.from, { user_objectives: { error: null } })

            await deleteObjective(9)

            expect(queries.user_objectives[0].delete).toHaveBeenCalled()
            expect(queries.user_objectives[0].eq).toHaveBeenCalledWith('id', 9)
        })
    })

    describe('toggleInterestTag', () => {
        it('sterge interesul cand era deja selectat', async () => {
            const queries = mockFrom(supabase.from, { user_interests: { error: null } })

            await toggleInterestTag(5, 2, true)

            expect(queries.user_interests[0].delete).toHaveBeenCalled()
            expect(queries.user_interests[0].eq).toHaveBeenCalledWith('user_id', 5)
            expect(queries.user_interests[0].eq).toHaveBeenCalledWith('category_id', 2)
        })

        it('adauga interesul cand nu era selectat', async () => {
            const queries = mockFrom(supabase.from, { user_interests: { error: null } })

            await toggleInterestTag(5, 2, false)

            expect(queries.user_interests[0].insert).toHaveBeenCalledWith({
                user_id: 5,
                category_id: 2,
            })
        })
    })
})

describe('backend/user/profile/updateProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    function form(name: string) {
        const fd = new FormData()
        fd.append('fullName', name)
        return fd
    }

    function authAs(userId: string | null) {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
            data: { user: userId ? { id: userId } : null },
            error: userId ? null : { message: 'no session' },
        } as any)
    }

    it('actualizeaza numele utilizatorului autentificat', async () => {
        authAs('auth-1')
        const queries = mockFrom(supabase.from, {
            users: [{ data: { id: 5 }, error: null }, { error: null }],
        })

        const result = await updateProfile(form('Ana Pop'))

        expect(result).toEqual({ success: true, message: 'Profile updated successfully.' })
        expect(queries.users[0].eq).toHaveBeenCalledWith('auth_key', 'auth-1')
        expect(queries.users[1].update).toHaveBeenCalledWith({ name: 'Ana Pop' })
        expect(queries.users[1].eq).toHaveBeenCalledWith('id', 5)
        expect(revalidatePath).toHaveBeenCalledWith('/profile')
    })

    it('respinge cererea cand nu exista sesiune', async () => {
        authAs(null)

        const result = await updateProfile(form('Ana'))

        expect(result).toEqual({ success: false, message: 'User not authenticated.' })
        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('respinge cererea cand userul nu exista in baza de date', async () => {
        authAs('auth-1')
        mockFrom(supabase.from, { users: { data: null, error: { message: 'not found' } } })

        const result = await updateProfile(form('Ana'))

        expect(result).toEqual({ success: false, message: 'User not found in database.' })
    })

    it('raporteaza esecul update-ului', async () => {
        authAs('auth-1')
        mockFrom(supabase.from, {
            users: [{ data: { id: 5 }, error: null }, { error: { message: 'denied' } }],
        })

        const result = await updateProfile(form('Ana'))

        expect(result).toEqual({ success: false, message: 'Failed to update profile.' })
        expect(revalidatePath).not.toHaveBeenCalled()
    })
})
