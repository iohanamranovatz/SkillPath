import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        // testele E2E ruleaza cu Playwright, nu cu Vitest
        exclude: ['**/node_modules/**', '**/.next/**', 'e2e/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            // toate fisierele de mai jos intra in raport, chiar daca niciun
            // test nu le importa
            include: [
                'app/**/*.{ts,tsx}',
                'backend/**/*.ts',
                'frontend/**/*.{ts,tsx}',
                'helper/**/*.js',
            ],
            exclude: [
                '**/*.d.ts',
                '**/node_modules/**',
                'frontend/**/lib/mock-data.ts',
                'frontend/**/lib/types.ts',
            ],
            thresholds: {
                lines: 75,
                statements: 75,
                functions: 75,
                branches: 70,
            },
        },
    },
})
