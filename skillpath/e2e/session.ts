import { expect, type Page } from '@playwright/test'
import { userCredentials, adminCredentials } from './credentials'

/**
 * Logging in through the UI.
 *
 * NOTE - why we do not use `storageState` (sessions saved on disk):
 * the app does not keep the session in cookies. `loginUser` is a server action
 * that calls `supabase.auth.signInWithPassword` on the singleton client from
 * `helper/SupabaseClient.js`, so the session ends up in the Node process memory
 * and is SHARED by all visitors. See the note in e2e/README.md.
 *
 * Consequence for the tests: what matters is not the browser cookies, but who
 * logged in last on the server. That is why every suite logs in explicitly
 * before its tests, and the run is sequential (`workers: 1`).
 *
 * Once sessions move to cookies, this helper can be replaced with
 * `storageState`, and `workers: 1` can go away.
 */

export async function logInAs(page: Page, role: 'user' | 'admin') {
    const { email, password } = role === 'admin' ? adminCredentials : userCredentials
    const expectedUrl = role === 'admin' ? /\/adminDashboard/ : /\/userDashboard/

    await page.goto('/login')
    await page.getByPlaceholder('alex.rivera@example.com').fill(email)
    await page.getByPlaceholder('••••••••').fill(password)
    await page.getByRole('button', { name: /Log In/ }).click()

    await expect(page).toHaveURL(expectedUrl, { timeout: 30_000 })
}

/**
 * Closes any active session on the server, so the route-protection tests start
 * from a clean slate even if the dev server has already been used.
 */
export async function signOutEveryone(page: Page) {
    await logInAs(page, 'user')
    await page.getByRole('button', { name: 'User menu' }).click()
    await page.getByText('Sign out').click()
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
}
