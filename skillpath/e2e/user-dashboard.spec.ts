import { test, expect } from '@playwright/test'
import { hasUserCredentials, MISSING_USER_CREDENTIALS } from './credentials'
import { logInAs } from './session'

/**
 * Parcursul studentului prin dashboard. Aceste teste doar citesc date,
 * cu exceptia celui de profil (adauga si sterge un obiectiv, cu curatare).
 */

test.skip(!hasUserCredentials(), MISSING_USER_CREDENTIALS)

test.beforeEach(async ({ page }) => {
    await logInAs(page, 'user')
    await page.goto('/userDashboard')
    await expect(page.getByText(/Welcome back,/)).toBeVisible()
})

test('dashboard-ul afiseaza salutul, statisticile si graficele', async ({ page }) => {
    await expect(page.getByText(/^Level:/)).toBeVisible()
    await expect(page.getByText('Tests completed')).toBeVisible()
    await expect(page.getByText('Problems solved')).toBeVisible()
    await expect(page.getByText('Current Objectives')).toBeVisible()
    await expect(page.getByText('Average score over time')).toBeVisible()
    await expect(page.getByText('Skill breakdown')).toBeVisible()
    await expect(page.getByText('Recent results')).toBeVisible()
    await expect(page.getByText('Recommended for you')).toBeVisible()
})

test('navigheaza intre toate vizualizarile din meniul lateral', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Main navigation' })

    await nav.getByRole('button', { name: 'Tests' }).click()
    await expect(page.getByRole('heading', { name: 'Tests' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'All tests' })).toBeVisible()

    await nav.getByRole('button', { name: 'Results' }).click()
    await expect(page.getByRole('heading', { name: /Results & Analytics/ })).toBeVisible({
        timeout: 20_000,
    })

    await nav.getByRole('button', { name: 'Resources' }).click()
    await expect(page.getByRole('heading', { name: 'Resources' })).toBeVisible()

    await nav.getByRole('button', { name: 'Profile' }).click()
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()

    await nav.getByRole('button', { name: 'Dashboard' }).click()
    await expect(page.getByText(/Welcome back,/)).toBeVisible()
})

test('butoanele din antet duc la progres si la teste', async ({ page }) => {
    await page.getByRole('button', { name: 'View progress' }).click()
    await expect(page.getByRole('heading', { name: /Results & Analytics/ })).toBeVisible({
        timeout: 20_000,
    })

    await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Dashboard' })
        .click()
    await page.getByRole('button', { name: 'Start a test' }).click()
    await expect(page.getByRole('heading', { name: 'Tests' })).toBeVisible()
})

test('cautarea filtreaza resursele', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Resources' })
        .click()

    const search = page.getByPlaceholder(/Search by categoty/)
    await search.fill('zzzz-nu-exista')

    await expect(page.getByText('No resources available found.')).toBeVisible()

    await search.fill('')
    await expect(page.getByText('No resources available found.')).toBeHidden()
})

test('lista de teste se poate filtra dupa cele finalizate', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Tests' })
        .click()

    await page.getByRole('button', { name: 'Completed' }).click()

    // fie apar doar teste cu scor, fie mesajul de lista goala
    const emptyState = page.getByText('No tests in this category yet.')
    const reviewButtons = page.getByRole('button', { name: /Review/ })

    if (await emptyState.isVisible()) {
        await expect(reviewButtons).toHaveCount(0)
    } else {
        await expect(reviewButtons.first()).toBeVisible()
        await expect(page.getByRole('button', { name: /Take test/ })).toHaveCount(0)
    }
})

test('profilul permite adaugarea si stergerea unui obiectiv', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Profile' })
        .click()
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()

    const objective = `E2E obiectiv ${Date.now()}`
    const input = page.getByPlaceholder('e.g. Master React Hooks')

    // daca cele 5 sloturi sunt ocupate, input-ul e dezactivat — sarim testul
    test.skip(await input.isDisabled(), 'contul de test are deja 5 obiective active')

    await input.fill(objective)
    await page.getByRole('button', { name: /Add/ }).click()

    await expect(page.getByText(objective)).toBeVisible({ timeout: 15_000 })

    // curatare: stergem obiectivul creat, ca sa nu ramana in contul de test
    const row = page
        .locator('div.flex.items-center.justify-between')
        .filter({ hasText: objective })
        .last()
    page.once('dialog', (dialog) => dialog.accept())
    await row.getByRole('button').last().click()

    // lista de obiective vine din server component, asa ca reincarcam pagina
    // ca sa verificam ca stergerea chiar a ajuns in baza de date
    await page.reload()
    await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Profile' })
        .click()
    await expect(page.getByText(objective)).toBeHidden({ timeout: 15_000 })
})

test('se poate face sign out din bara de sus', async ({ page }) => {
    await page.getByRole('button', { name: 'User menu' }).click()
    await page.getByText('Sign out').click()

    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 })
})
