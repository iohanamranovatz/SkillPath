/**
 * Credentialele conturilor de test.
 *
 * NU se scriu in cod si nu se comit: se pun in e2e/.env.test.local, care este
 * ignorat de git. Daca lipsesc, suitele care au nevoie de login se marcheaza
 * ca "skipped" in loc sa pice.
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
