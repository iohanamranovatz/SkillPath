import { test, expect } from '@playwright/test'
import { hasUserCredentials } from './credentials'
import { signOutEveryone } from './session'

/**
 * Public suite: it needs no account and writes nothing to the database.
 */

test.describe('landing page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
    })

    test('shows the main message and the presentation sections', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Master your skills/ })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Adaptive assessments' })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Skill radar' })).toBeVisible()
    })

    test('leads to the login page', async ({ page }) => {
        await page.getByRole('link', { name: 'I already have an account' }).click()

        await expect(page).toHaveURL(/\/login/)
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    })

    test('leads to the sign up page', async ({ page }) => {
        await page.getByRole('link', { name: /Start for free/ }).click()

        await expect(page).toHaveURL(/\/signup/)
    })

    test('the menu anchors navigate within the page', async ({ page }) => {
        await page.getByRole('link', { name: 'How it works' }).click()

        await expect(page).toHaveURL(/#how/)
    })
})

test.describe('login', () => {
    test('rejects wrong credentials', async ({ page }) => {
        await page.goto('/login')

        await page.getByPlaceholder('alex.rivera@example.com').fill('inexistent@skillpath.test')
        await page.getByPlaceholder('••••••••').fill('parola-gresita-123')
        await page.getByRole('button', { name: /Log In/ }).click()

        await expect(page.getByText('Email sau parola incorecta!')).toBeVisible()
        await expect(page).toHaveURL(/\/login/)
    })

    test('does not submit the form with empty fields', async ({ page }) => {
        await page.goto('/login')

        await page.getByRole('button', { name: /Log In/ }).click()

        // validarea nativa a browserului opreste trimiterea
        await expect(page).toHaveURL(/\/login/)
        const emailInput = page.getByPlaceholder('alex.rivera@example.com')
        await expect(emailInput).toHaveJSProperty('validity.valid', false)
    })

    test('has a link to sign up', async ({ page }) => {
        await page.goto('/login')

        await page.getByRole('link', { name: 'Sign up' }).click()

        await expect(page).toHaveURL(/\/signup/)
    })
})

test.describe('sign up', () => {
    // The form is validated client-side before reaching Supabase,
    // so the tests below do not create accounts.
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

    test('reports passwords that do not match', async ({ page }) => {
        await fillSignUp(page, { password: 'parola123', confirm: 'altceva123' })

        await expect(page.getByText('Passwords do not match!')).toBeVisible()
    })

    test('requires at least 6 characters', async ({ page }) => {
        await fillSignUp(page, { password: '123', confirm: '123' })

        await expect(page.getByText('Password must be at least 6 characters long!')).toBeVisible()
    })
})

test.describe('route protection', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    // The session lives in the server process, not in the browser (see e2e/session.ts),
    // so an earlier login would make these routes accessible. We make sure
    // nobody is logged in before checking the protection.
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
