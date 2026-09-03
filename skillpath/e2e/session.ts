import { expect, type Page } from '@playwright/test'
import { userCredentials, adminCredentials } from './credentials'

/**
 * Autentificare prin interfata.
 *
 * ATENTIE — de ce nu folosim `storageState` (sesiuni salvate pe disc):
 * aplicatia nu tine sesiunea in cookie-uri. `loginUser` este o server action
 * care apeleaza `supabase.auth.signInWithPassword` pe clientul singleton din
 * `helper/SupabaseClient.js`, deci sesiunea ajunge in memoria procesului Node
 * si este COMUNA tuturor vizitatorilor. Vezi nota din e2e/README.md.
 *
 * Consecinta pentru teste: nu conteaza ce cookie-uri are browserul, ci cine
 * s-a logat ultimul pe server. De aceea fiecare suita se logheaza explicit
 * inainte de teste, iar rularea este secventiala (`workers: 1`).
 *
 * Cand sesiunile vor fi mutate pe cookie-uri, acest helper poate fi inlocuit
 * cu `storageState`, iar `workers: 1` poate disparea.
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
 * Inchide orice sesiune activa pe server, ca testele de protectie a rutelor
 * sa porneasca de la zero chiar daca serverul de dev a fost deja folosit.
 */
export async function signOutEveryone(page: Page) {
    await logInAs(page, 'user')
    await page.getByRole('button', { name: 'User menu' }).click()
    await page.getByText('Sign out').click()
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
}
