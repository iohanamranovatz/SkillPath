import { test, expect } from '@playwright/test'
import { hasUserCredentials, MISSING_USER_CREDENTIALS } from './credentials'
import { logInAs } from './session'

/**
 * Fluxul complet al unui test de evaluare, de la generare pana la rezultate.
 *
 * ATENTIE: acest fisier SCRIE in baza de date (creeaza un assessment si
 * raspunsurile lui, si poate schimba nivelul estimat al userului). De aceea
 * trebuie rulat doar cu un cont de test dedicat.
 */

test.skip(!hasUserCredentials(), MISSING_USER_CREDENTIALS)

test.beforeEach(async ({ page }) => {
    await logInAs(page, 'user')
})

test('genereaza un test, raspunde la toate intrebarile si vede scorul', async ({ page }) => {
    await page.goto('/assessment/new')
    await expect(page.getByRole('heading', { name: 'Start a new test' })).toBeVisible()

    const noCategories = page.getByText(/Nu exista categorii/)
    test.skip(
        await noCategories.isVisible(),
        'nu exista categorii pentru nivelul contului de test'
    )

    // alegem prima categorie disponibila si pornim testul
    const startButton = page.getByRole('button', { name: 'Start test' })
    await expect(startButton).toBeDisabled()

    await page.locator('div.flex.flex-wrap button').first().click()
    await expect(startButton).toBeEnabled()
    await startButton.click()

    // suntem pe pagina testului generat
    await expect(page).toHaveURL(/\/assessment\/\d+$/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: 'Test', exact: true })).toBeVisible()

    const questionCards = page.locator('[data-slot="card"]')
    const questionCount = await questionCards.count()
    expect(questionCount).toBeGreaterThan(0)

    // raspundem la fiecare intrebare cu prima varianta
    for (let i = 0; i < questionCount; i++) {
        await questionCards.nth(i).locator('button').first().click()
    }

    // auto-save-ul confirma salvarea in fundal
    await expect(page.getByText('Saving...')).toBeHidden({ timeout: 20_000 })

    await page.getByRole('button', { name: /Trimite|Finalizeaz|Submit/i }).click()

    // ecranul de rezultat
    await expect(page.getByRole('heading', { name: 'Test finalizat!' })).toBeVisible({
        timeout: 30_000,
    })
    await expect(page.getByText(/din \d+ corecte/)).toBeVisible()
    await expect(page.getByText('Scor pe categorie')).toBeVisible()
    await expect(page.getByText(/^\d+%$/).first()).toBeVisible()

    await page.getByRole('button', { name: 'Inapoi la dashboard' }).click()
    await expect(page).toHaveURL(/\/userDashboard/)
})

test('un test finalizat poate fi revizuit din lista de teste', async ({ page }) => {
    await page.goto('/userDashboard')
    await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Tests' })
        .click()
    await page.getByRole('button', { name: 'Completed' }).click()

    const review = page.getByRole('button', { name: /Review/ }).first()
    test.skip(!(await review.isVisible()), 'contul de test nu are niciun test finalizat')

    await review.click()

    await expect(page).toHaveURL(/\/assessment\/\d+\/completed/)
    await expect(page.getByRole('heading', { name: 'Assessment Results' })).toBeVisible()
    await expect(page.getByText('Final Score')).toBeVisible()
    await expect(page.getByText(/Started:/)).toBeVisible()

    await page.getByRole('button', { name: 'Back to Dashboard' }).click()
    await expect(page).toHaveURL(/\/userDashboard/)
})

test('rezultatele arata scorul pe categorii si resursele recomandate', async ({ page }) => {
    await page.goto('/userDashboard')
    await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Results' })
        .click()

    await expect(page.getByRole('heading', { name: /Results & Analytics/ })).toBeVisible({
        timeout: 30_000,
    })
    await expect(page.getByText('Final Score (Average)')).toBeVisible()
    await expect(page.getByText('Estimated level')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Score per Category' })).toBeVisible()
})

test('un test in desfasurare nu poate fi accesat prin ruta de rezultate', async ({ page }) => {
    await page.goto('/userDashboard')
    await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Tests' })
        .click()

    const take = page.getByRole('button', { name: /Take test/ }).first()
    test.skip(!(await take.isVisible()), 'contul de test nu are niciun test neterminat')

    await take.click()
    await expect(page).toHaveURL(/\/assessment\/\d+$/)

    const assessmentId = page.url().match(/\/assessment\/(\d+)/)![1]
    await page.goto(`/assessment/${assessmentId}/completed`)

    // pagina de rezultate redirectioneaza inapoi la test
    await expect(page).toHaveURL(new RegExp(`/assessment/${assessmentId}$`))
})
