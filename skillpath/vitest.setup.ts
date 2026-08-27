import { vi } from 'vitest'

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}))