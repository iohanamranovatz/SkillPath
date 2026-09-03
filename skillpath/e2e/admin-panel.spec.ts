import { test, expect } from '@playwright/test'
import { hasAdminCredentials, MISSING_ADMIN_CREDENTIALS } from './credentials'
import { logInAs } from './session'

/**
 * Zona de administrare.
 *
 * Testele de citire (dashboard, question bank, manage users) nu modifica nimic.
 * Testul de categorii creeaza o categorie temporara si o sterge la final.
 */

test.skip(!hasAdminCredentials(), MISSING_ADMIN_CREDENTIALS)

test.beforeEach(async ({ page }) => {
    await logInAs(page, 'admin')
})

test.describe('dashboard admin', () => {
    test('afiseaza statisticile si cardurile de analiza', async ({ page }) => {
        await page.goto('/adminDashboard')

        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
        await expect(page.getByText('Total Students')).toBeVisible()
        await expect(
            page.getByRole('paragraph').filter({ hasText: /^Assessments$/ })
        ).toBeVisible()
        await expect(page.getByText('Assessment Activity')).toBeVisible()
        await expect(page.getByText('Weakest Categories')).toBeVisible()
        await expect(page.getByText('Most Prolific Users')).toBeVisible()
    })

    test('meniul lateral navigheaza intre sectiuni', async ({ page }) => {
        await page.goto('/adminDashboard')
        const nav = page.getByRole('navigation', { name: 'Main navigation' })

        await nav.getByRole('link', { name: 'Question bank' }).click()
        await expect(page).toHaveURL(/\/questions/)
        await expect(page.getByRole('heading', { name: 'Question Bank' })).toBeVisible()

        await nav.getByRole('link', { name: 'Manage categories' }).click()
        await expect(page).toHaveURL(/\/categories/)
        await expect(page.getByRole('heading', { name: 'Skill Categories' })).toBeVisible()

        await nav.getByRole('link', { name: 'Manage users' }).click()
        await expect(page).toHaveURL(/\/manageUsers/)
        await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible()
    })

    test('meniul lateral se poate plia', async ({ page }) => {
        await page.goto('/adminDashboard')

        await expect(page.getByText('Manage users')).toBeVisible()
        await page.getByRole('button', { name: 'Toggle sidebar' }).click()
        await expect(page.getByText('Manage users')).toBeHidden()
    })
})

test.describe('question bank', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/questions')
        await expect(page.getByRole('heading', { name: 'Question Bank' })).toBeVisible()
    })

    test('filtreaza dupa dificultate si dupa text', async ({ page }) => {
        await page.getByRole('combobox').selectOption('HARD')
        const rows = page.locator('tbody tr')

        if (await page.getByText('No questions found.').isVisible()) {
            await expect(rows).toHaveCount(1)
        } else {
            await expect(page.locator('tbody tr td', { hasText: 'HARD' }).first()).toBeVisible()
            await expect(page.locator('tbody tr td', { hasText: 'EASY' })).toHaveCount(0)
        }

        await page.getByRole('combobox').selectOption('all')
        await page.getByPlaceholder('Search questions...').fill('zzzz-nu-exista')
        await expect(page.getByText('No questions found.')).toBeVisible()
    })

    test('deschide panoul de detalii al unei intrebari', async ({ page }) => {
        const firstRow = page.locator('tbody tr').first()
        test.skip(
            await page.getByText('No questions found.').isVisible(),
            'nu exista intrebari in baza de date'
        )

        await firstRow.click()

        await expect(page).toHaveURL(/\?id=/)
        await expect(page.getByRole('heading', { name: 'Question Details' })).toBeVisible()
        await expect(page.getByText('Prompt')).toBeVisible()
        await expect(page.getByText('Options')).toBeVisible()

        // trecem in editare si iesim fara sa salvam
        await page.getByRole('button', { name: /Edit Question/ }).click()
        await expect(page.getByRole('heading', { name: 'Edit Question' })).toBeVisible()
        await page.getByRole('button', { name: 'Cancel' }).click()
        await expect(page.getByRole('heading', { name: 'Question Details' })).toBeVisible()
    })

    test('deschide formularul de intrebare noua fara sa o salveze', async ({ page }) => {
        await page.getByRole('button', { name: /Add Question/ }).click()

        await expect(page.getByRole('heading', { name: 'Add New Question' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Create Question' })).toBeVisible()

        await page.getByRole('button', { name: 'Cancel' }).click()
        await expect(page.getByRole('heading', { name: 'Add New Question' })).toBeHidden()
    })
})

test.describe('manage users', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/manageUsers')
        await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible()
        await expect(page.getByText('Loading users...')).toBeHidden({ timeout: 20_000 })
    })

    test('cauta si filtreaza utilizatorii', async ({ page }) => {
        await page.getByPlaceholder('Search users...').fill('zzzz-nu-exista')
        await expect(page.getByText('No users found.')).toBeVisible()

        await page.getByPlaceholder('Search users...').fill('')
        await expect(page.getByText('No users found.')).toBeHidden()

        // filtrul de rol
        await page.locator('select').last().selectOption('admin')
        await expect(page.locator('tbody tr').first()).toBeVisible()
    })

    test('deschide pagina de detalii a unui utilizator', async ({ page }) => {
        const firstDetails = page.getByRole('link', { name: /Details/ }).first()
        test.skip(!(await firstDetails.isVisible()), 'nu exista utilizatori')

        await firstDetails.click()

        await expect(page).toHaveURL(/\/manageUsers\/\d+/)
        await expect(page.getByText('Taken Tests')).toBeVisible()
        await expect(page.getByText('Completed Tests')).toBeVisible()
        await expect(page.getByText('Overall Average Score')).toBeVisible()

        await page.getByRole('link', { name: /Back to User Management/ }).click()
        await expect(page).toHaveURL(/\/manageUsers$/)
    })

    test('deschide modalul de adaugare fara sa creeze utilizatorul', async ({ page }) => {
        await page.getByRole('button', { name: '+ Add User' }).click()

        await expect(page.getByRole('heading', { name: 'Add New User' })).toBeVisible()

        await page.getByRole('button', { name: 'Cancel' }).click()
        await expect(page.getByRole('heading', { name: 'Add New User' })).toBeHidden()
    })
})

test.describe('categorii', () => {
    test('cauta printre categorii', async ({ page }) => {
        await page.goto('/categories')
        await expect(page.getByRole('heading', { name: 'Skill Categories' })).toBeVisible()
        await expect(page.getByText('Loading…')).toBeHidden({ timeout: 20_000 })

        await page.getByPlaceholder('Search categories...').fill('zzzz-nu-exista')
        await expect(page.getByText('No categories found.')).toBeVisible()
    })

    test('creeaza o categorie temporara si o sterge la final', async ({ page }) => {
        await page.goto('/categories')
        await expect(page.getByText('Loading…')).toBeHidden({ timeout: 20_000 })

        const name = `E2E temp ${Date.now()}`

        await page.getByRole('button', { name: /Add Category/ }).click()
        await expect(page.getByRole('heading', { name: 'New Category' })).toBeVisible()

        await page.getByPlaceholder('ex. Backend').fill(name)
        await page.getByPlaceholder('Short description…').fill('creata de testul E2E')
        await page.getByRole('button', { name: 'Create' }).click()

        // categoria noua ajunge la finalul listei paginate, deci o cautam
        await page.getByPlaceholder('Search categories...').fill(name)
        await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 20_000 })

        // curatare: stergem categoria creata
        const card = page.locator('div.group').filter({ hasText: name }).first()
        await card.hover()
        await card.getByTitle('Delete').click()

        // butonul de confirmare din modal, nu cel de pe card
        const confirmModal = page.locator('div.fixed.inset-0').filter({
            hasText: 'Delete category?',
        })
        await expect(confirmModal.getByRole('heading', { name: 'Delete category?' })).toBeVisible()
        await confirmModal.getByRole('button', { name: 'Delete', exact: true }).click()

        await expect(confirmModal).toBeHidden({ timeout: 20_000 })
        await page.getByPlaceholder('Search categories...').fill(name)
        await expect(page.getByText('No categories found.')).toBeVisible({ timeout: 20_000 })
    })

    test('pagina de detalii a unei categorii listeaza resurse si intrebari', async ({ page }) => {
        await page.goto('/categories')
        await expect(page.getByText('Loading…')).toBeHidden({ timeout: 20_000 })

        const firstCard = page.locator('div.group').first()
        test.skip(!(await firstCard.isVisible()), 'nu exista categorii')

        await firstCard.click()

        await expect(page).toHaveURL(/\/categories\/\d+/)
        await expect(page.getByRole('heading', { name: 'Learning Resources' })).toBeVisible()
        await expect(page.getByRole('heading', { name: /Questions \(\d+\)/ })).toBeVisible()
        await expect(page.getByPlaceholder('Title')).toBeVisible()
    })
})
