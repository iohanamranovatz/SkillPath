import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Credentialele conturilor de test se citesc din e2e/.env.test.local
// (fisier ignorat de git — vezi e2e/README.md)
dotenv.config({ path: path.resolve(__dirname, 'e2e/.env.test.local') })

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
    testDir: './e2e',
    // testele scriu in Supabase, deci le rulam pe rand ca sa nu se calce in picioare
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    reporter: [['list'], ['html', { open: 'never' }]],

    use: {
        baseURL: BASE_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    // Ordinea proiectelor conteaza: `public` verifica protectia rutelor si
    // trebuie sa ruleze inainte ca vreo suita sa se autentifice.
    projects: [
        {
            name: 'public',
            testMatch: /public\.spec\.ts/,
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'user',
            testMatch: /user-.*\.spec\.ts/,
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'admin',
            testMatch: /admin-.*\.spec\.ts/,
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // porneste `npm run dev` automat, daca nu ruleaza deja
    webServer: {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
    },
})
