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

    it('trimite credentialele catre server', async () => {
        vi.mocked(loginUser).mockResolvedValue(undefined as any)
        render(<LoginForm />)

        fill()
        fireEvent.click(screen.getByRole('button', { name: /Log In/ }))

        await waitFor(() => expect(loginUser).toHaveBeenCalledWith('ana@test.com', 'parola123'))
        expect(screen.queryByText(/incorecta/)).toBeNull()
    })

    it('afiseaza eroarea returnata de server', async () => {
        vi.mocked(loginUser).mockResolvedValue({
            succes: false,
            message: 'Email sau parola incorecta!',
        } as any)
        render(<LoginForm />)

        fill('gresit@test.com', 'gresita')
        fireEvent.click(screen.getByRole('button', { name: /Log In/ }))

        expect(await screen.findByText('Email sau parola incorecta!')).toBeTruthy()
    })

    it('are link catre pagina de inregistrare', () => {
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

    it('creeaza contul si afiseaza mesajul de confirmare', async () => {
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

    it('verifica potrivirea parolelor', async () => {
        render(<SignUpForm />)

        fill({ confirm: 'altceva' })
        submit()

        expect(await screen.findByText('Passwords do not match!')).toBeTruthy()
        expect(signUpUser).not.toHaveBeenCalled()
    })

    it('cere minimum 6 caractere pentru parola', async () => {
        render(<SignUpForm />)

        fill({ password: '123', confirm: '123' })
        submit()

        expect(await screen.findByText('Password must be at least 6 characters long!')).toBeTruthy()
        expect(signUpUser).not.toHaveBeenCalled()
    })

    it('afiseaza eroarea venita de la Supabase', async () => {
        vi.mocked(signUpUser).mockResolvedValue({
            success: false,
            message: 'User already registered',
        })
        render(<SignUpForm />)

        fill()
        submit()

        expect(await screen.findByText('User already registered')).toBeTruthy()
    })

    it('prinde exceptiile neasteptate', async () => {
        vi.mocked(signUpUser).mockRejectedValue(new Error('Network down'))
        render(<SignUpForm />)

        fill()
        submit()

        expect(await screen.findByText('Network down')).toBeTruthy()
    })
})
