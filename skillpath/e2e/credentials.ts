/**
 * Credentials for the test accounts.
 *
 * They are NOT written in code and NOT committed: put them in
 * e2e/.env.test.local, which is git-ignored. If they are missing, the suites
 * that need a login are marked as "skipped" instead of failing.
 */

export const userCredentials = {
    email: process.env.E2E_USER_EMAIL ?? '',
    password: process.env.E2E_USER_PASSWORD ?? '',
}

export const adminCredentials = {
    email: process.env.E2E_ADMIN_EMAIL ?? '',
    password: process.env.E2E_ADMIN_PASSWORD ?? '',
}

export const hasUserCredentials = () =>
    Boolean(userCredentials.email && userCredentials.password)

export const hasAdminCredentials = () =>
    Boolean(adminCredentials.email && adminCredentials.password)

export const MISSING_USER_CREDENTIALS =
    'Lipsesc E2E_USER_EMAIL / E2E_USER_PASSWORD din e2e/.env.test.local'

export const MISSING_ADMIN_CREDENTIALS =
    'Lipsesc E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD din e2e/.env.test.local'
