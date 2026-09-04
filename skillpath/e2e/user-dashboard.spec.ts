import { test, expect } from '@playwright/test'
import { hasUserCredentials, MISSING_USER_CREDENTIALS } from './credentials'
import { logInAs } from './session'

/**
 * The student journey through the dashboard. These tests only read data,
 * except the profile one (it adds and deletes an objective, with cleanup).
 */

test.skip(!hasUserCredentials(), MISSING_USER_CREDENTIALS)

test.beforeEach(async ({ page }) => {
    await logInAs(page, 'user')
    await page.goto('/userDashboard')
    await expect(page.getByText(/Welcome back,/)).toBeVisible()
})

test('the dashboard shows the greeting, the stats and the charts', async ({ page }) => {
    await expect(page.getByText(/^Level:/)).toBeVisible()
    await expect(page.getByText('Tests completed')).toBeVisible()
    await expect(page.getByText('Problems solved')).toBeVisible()
    await expect(page.getByText('Current Objectives')).toBeVisible()
    await expect(page.getByText('Average score over time')).toBeVisible()
    await expect(page.getByText('Skill breakdown')).toBeVisible()
    await expect(page.getByText('Recent results')).toBeVisible()
    await expect(page.getByText('Recommended for you')).toBeVisible()
})

test('navigates between all the views in the sidebar', async ({ page }) => {
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

test('the header buttons lead to progress and to tests', async ({ page }) => {
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

test('the search filters the resources', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Resources' })
        .click()

    const search = page.getByPlaceholder(/Search by categoty/)
    await search.fill('zzzz-nu-exista')

    await expect(page.getByText('No resources available found.')).toBeVisible()

    await search.fill('')
    await expect(page.getByText('No resources available found.')).toBeHidden()
})

test('the test list can be filtered by completed tests', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Tests' })
        .click()

    await page.getByRole('button', { name: 'Completed' }).click()

    // either only scored tests show up, or the empty-list message
    const emptyState = page.getByText('No tests in this category yet.')
    const reviewButtons = page.getByRole('button', { name: /Review/ })

    if (await emptyState.isVisible()) {
        await expect(reviewButtons).toHaveCount(0)
    } else {
        await expect(reviewButtons.first()).toBeVisible()
        await expect(page.getByRole('button', { name: /Take test/ })).toHaveCount(0)
    }
})

test('the profile allows adding and deleting an objective', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Profile' })
        .click()
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()

    const objective = `E2E obiectiv ${Date.now()}`
    const input = page.getByPlaceholder('e.g. Master React Hooks')

    // if the 5 slots are taken the input is disabled - skip the test
    test.skip(await input.isDisabled(), 'contul de test are deja 5 obiective active')

    await input.fill(objective)
    await page.getByRole('button', { name: /Add/ }).click()

    await expect(page.getByText(objective)).toBeVisible({ timeout: 15_000 })

    // cleanup: delete the objective we created so it does not stay in the test account
    const row = page
        .locator('div.flex.items-center.justify-between')
        .filter({ hasText: objective })
        .last()
    page.once('dialog', (dialog) => dialog.accept())
    await row.getByRole('button').last().click()

    // the objective list comes from a server component, so we reload the page
    // to check that the delete really reached the database
    await page.reload()
    await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Profile' })
        .click()
    await expect(page.getByText(objective)).toBeHidden({ timeout: 15_000 })
})

test('sign out works from the top bar', async ({ page }) => {
    await page.getByRole('button', { name: 'User menu' }).click()
    await page.getByText('Sign out').click()

    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 })
})
