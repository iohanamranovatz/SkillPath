import { test, expect } from '@playwright/test'
import { hasUserCredentials } from './credentials'
import { signOutEveryone } from './session'

/**
 * Suita publica: nu are nevoie de cont si nu scrie nimic in baza de date.
 */

test.describe('landing page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
    })

    test('afiseaza mesajul principal si sectiunile de prezentare', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Master your skills/ })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Adaptive assessments' })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Skill radar' })).toBeVisible()
    })

    test('duce catre pagina de autentificare', async ({ page }) => {
        await page.getByRole('link', { name: 'I already have an account' }).click()

        await expect(page).toHaveURL(/\/login/)
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    })

    test('duce catre pagina de inregistrare', async ({ page }) => {
        await page.getByRole('link', { name: /Start for free/ }).click()

        await expect(page).toHaveURL(/\/signup/)
    })

    test('ancorele din meniu navigheaza in pagina', async ({ page }) => {
        await page.getByRole('link', { name: 'How it works' }).click()

        await expect(page).toHaveURL(/#how/)
    })
})

test.describe('autentificare', () => {
    test('respinge credentialele gresite', async ({ page }) => {
        await page.goto('/login')

        await page.getByPlaceholder('alex.rivera@example.com').fill('inexistent@skillpath.test')
        await page.getByPlaceholder('••••••••').fill('parola-gresita-123')
        await page.getByRole('button', { name: /Log In/ }).click()

        await expect(page.getByText('Email sau parola incorecta!')).toBeVisible()
        await expect(page).toHaveURL(/\/login/)
    })

    test('nu trimite formularul cu campuri goale', async ({ page }) => {
        await page.goto('/login')

        await page.getByRole('button', { name: /Log In/ }).click()

        // validarea nativa a browserului opreste trimiterea
        await expect(page).toHaveURL(/\/login/)
        const emailInput = page.getByPlaceholder('alex.rivera@example.com')
        await expect(emailInput).toHaveJSProperty('validity.valid', false)
    })

    test('are legatura catre inregistrare', async ({ page }) => {
        await page.goto('/login')

        await page.getByRole('link', { name: 'Sign up' }).click()

        await expect(page).toHaveURL(/\/signup/)
    })
})

test.describe('inregistrare', () => {
    // Formularul se valideaza client-side inainte de a atinge Supabase,
    // deci testele de mai jos nu creeaza conturi.
    test.beforeEach(async ({ page }) => {
        await page.goto('/signup')
    })

    async function fillSignUp(
        page: import('@playwright/test').Page,
        { password, confirm }: { password: string; confirm: string }
    ) {
        const inputs = page.locator('form input')
        await inputs.nth(0).fill('Test User')
        await inputs.nth(1).fill('nu-se-creeaza@skillpath.test')
        await inputs.nth(2).fill(password)
        await inputs.nth(3).fill(confirm)
        await page.getByRole('button', { name: /Sign Up|Create|Register/i }).click()
    }

    test('semnaleaza parolele care nu se potrivesc', async ({ page }) => {
        await fillSignUp(page, { password: 'parola123', confirm: 'altceva123' })

        await expect(page.getByText('Passwords do not match!')).toBeVisible()
    })

    test('cere minimum 6 caractere', async ({ page }) => {
        await fillSignUp(page, { password: '123', confirm: '123' })

        await expect(page.getByText('Password must be at least 6 characters long!')).toBeVisible()
    })
})

test.describe('protectia rutelor', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    // Sesiunea traieste in procesul serverului, nu in browser (vezi e2e/session.ts),
    // deci un login anterior ar face aceste rute accesibile. Ne asiguram ca
    // nimeni nu e logat inainte de a verifica protectia.
    test.beforeAll(async ({ browser }) => {
        if (!hasUserCredentials()) return
        const page = await browser.newPage()
        await signOutEveryone(page)
        await page.close()
    })

    for (const route of ['/userDashboard', '/adminDashboard', '/profile', '/assessment/new']) {
        test(`${route} nu este accesibila fara sesiune`, async ({ page }) => {
            await page.goto(route)

            await expect(page).toHaveURL(/\/$|\/login/)
        })
    }
})
