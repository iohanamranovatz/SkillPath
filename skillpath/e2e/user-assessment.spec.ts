import { test, expect } from '@playwright/test'
import { hasUserCredentials, MISSING_USER_CREDENTIALS } from './credentials'
import { logInAs } from './session'

/**
 * The full flow of an assessment, from generation to results.
 *
 * WARNING: this file WRITES to the database (it creates an assessment and its
 * answers, and it may change the estimated level of the user). That is why it
 * must only be run with a dedicated test account.
 */

test.skip(!hasUserCredentials(), MISSING_USER_CREDENTIALS)

test.beforeEach(async ({ page }) => {
    await logInAs(page, 'user')
})

test('generates a test, answers every question and sees the score', async ({ page }) => {
    await page.goto('/assessment/new')
    await expect(page.getByRole('heading', { name: 'Start a new test' })).toBeVisible()

    const noCategories = page.getByText(/Nu exista categorii/)
    test.skip(
        await noCategories.isVisible(),
        'nu exista categorii pentru nivelul contului de test'
    )

    // pick the first available category and start the test
    const startButton = page.getByRole('button', { name: 'Start test' })
    await expect(startButton).toBeDisabled()

    await page.locator('div.flex.flex-wrap button').first().click()
    await expect(startButton).toBeEnabled()
    await startButton.click()

    // we are on the page of the generated test
    await expect(page).toHaveURL(/\/assessment\/\d+$/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: 'Test', exact: true })).toBeVisible()

    const questionCards = page.locator('[data-slot="card"]')
    const questionCount = await questionCards.count()
    expect(questionCount).toBeGreaterThan(0)

    // answer every question with the first option
    for (let i = 0; i < questionCount; i++) {
        await questionCards.nth(i).locator('button').first().click()
    }

    // the auto-save confirms the background save
    await expect(page.getByText('Saving...')).toBeHidden({ timeout: 20_000 })

    await page.getByRole('button', { name: /Trimite|Finalizeaz|Submit/i }).click()

    // the result screen
    await expect(page.getByRole('heading', { name: 'Test finalizat!' })).toBeVisible({
        timeout: 30_000,
    })
    await expect(page.getByText(/din \d+ corecte/)).toBeVisible()
    await expect(page.getByText('Scor pe categorie')).toBeVisible()
    await expect(page.getByText(/^\d+%$/).first()).toBeVisible()

    await page.getByRole('button', { name: 'Inapoi la dashboard' }).click()
    await expect(page).toHaveURL(/\/userDashboard/)
})

test('a completed test can be reviewed from the test list', async ({ page }) => {
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

test('the results show the score per category and the recommended resources', async ({ page }) => {
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

test('a test in progress cannot be accessed through the results route', async ({ page }) => {
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

    // the results page redirects back to the test
    await expect(page).toHaveURL(new RegExp(`/assessment/${assessmentId}$`))
})
