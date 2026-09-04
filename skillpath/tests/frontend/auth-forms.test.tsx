import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/frontend/LoginForm'
import { SignUpForm } from '@/frontend/SignUpForm'
import { loginUser } from '@/backend/auth/loginUser'
import { signUpUser } from '@/backend/auth/signUpUser'

vi.mock('@/backend/auth/loginUser', () => ({ loginUser: vi.fn() }))
vi.mock('@/backend/auth/signUpUser', () => ({ signUpUser: vi.fn() }))

beforeEach(() => {
    vi.clearAllMocks()
})

describe('LoginForm', () => {
    function fill(email = 'ana@test.com', password = 'parola123') {
        fireEvent.change(screen.getByPlaceholderText('alex.rivera@example.com'), {
            target: { value: email },
        })
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: password } })
    }

    it('sends the credentials to the server', async () => {
        vi.mocked(loginUser).mockResolvedValue(undefined as any)
        render(<LoginForm />)

        fill()
        fireEvent.click(screen.getByRole('button', { name: /Log In/ }))

        await waitFor(() => expect(loginUser).toHaveBeenCalledWith('ana@test.com', 'parola123'))
        expect(screen.queryByText(/incorecta/)).toBeNull()
    })

    it('shows the error returned by the server', async () => {
        vi.mocked(loginUser).mockResolvedValue({
            success: false,
            message: 'Incorrect email or password!',
        } as any)
        render(<LoginForm />)

        fill('gresit@test.com', 'gresita')
        fireEvent.click(screen.getByRole('button', { name: /Log In/ }))

        expect(await screen.findByText('Incorrect email or password!')).toBeTruthy()
    })

    it('has a link to the sign up page', () => {
        render(<LoginForm />)

        expect(screen.getByRole('link', { name: 'Sign up' }).getAttribute('href')).toBe('/signup')
    })
})

describe('SignUpForm', () => {
    function fill({
        name = 'Ana',
        email = 'ana@test.com',
        password = 'parola123',
        confirm = 'parola123',
    } = {}) {
        const inputs = document.querySelectorAll('input')
        fireEvent.change(inputs[0], { target: { value: name } })
        fireEvent.change(inputs[1], { target: { value: email } })
        fireEvent.change(inputs[2], { target: { value: password } })
        fireEvent.change(inputs[3], { target: { value: confirm } })
    }

    function submit() {
        fireEvent.submit(document.querySelector('form')!)
    }

    it('creates the account and shows the confirmation message', async () => {
        vi.mocked(signUpUser).mockResolvedValue({
            success: true,
            message: 'The account has been created successfully! Please check your email to verify your account.',
        })
        render(<SignUpForm />)

        fill()
        submit()

        expect(await screen.findByText(/created successfully/)).toBeTruthy()
        expect(signUpUser).toHaveBeenCalledWith('Ana', 'ana@test.com', 'parola123')
    })

    it('checks that the passwords match', async () => {
        render(<SignUpForm />)

        fill({ confirm: 'altceva' })
        submit()

        expect(await screen.findByText('Passwords do not match!')).toBeTruthy()
        expect(signUpUser).not.toHaveBeenCalled()
    })

    it('requires at least 6 characters for the password', async () => {
        render(<SignUpForm />)

        fill({ password: '123', confirm: '123' })
        submit()

        expect(await screen.findByText('Password must be at least 6 characters long!')).toBeTruthy()
        expect(signUpUser).not.toHaveBeenCalled()
    })

    it('shows the error coming from Supabase', async () => {
        vi.mocked(signUpUser).mockResolvedValue({
            success: false,
            message: 'User already registered',
        })
        render(<SignUpForm />)

        fill()
        submit()

        expect(await screen.findByText('User already registered')).toBeTruthy()
    })

    it('catches unexpected exceptions', async () => {
        vi.mocked(signUpUser).mockRejectedValue(new Error('Network down'))
        render(<SignUpForm />)

        fill()
        submit()

        expect(await screen.findByText('Network down')).toBeTruthy()
    })
})
