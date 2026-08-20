"use client";

import { useState } from 'react';
import { signUpUser } from '@/backend/signUpUser';

export function SignUpForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [eroare, setEroare] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEroare('');
        setSuccessMessage('');
        
        if (password != confirmPassword) {
            setEroare("Passwords do not match!");
            return;
        }
        
        if (password.length < 6) {
            setEroare("Password must be at least 6 characters long!");
            return;
        }
        
        setLoading(true);
        
        try {
            const res = await signUpUser(name, email, password);

            if (!res.success) {
                setEroare(res.message);
            } else {
                setSuccessMessage(res.message);
            }
        } catch (error) {
            setEroare((error as Error).message || "An error occurred during sign up.");
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-[#101218] p-4 text-gray-100 font-sans">

            <div className="w-full max-w-md bg-[#1C1F28] border border-gray-800 rounded-2xl p-8 shadow-2xl">

                {/* Logo "Codewell" reprodus din design */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="bg-[#6B72E1] p-2 rounded-xl flex items-center justify-center w-10 h-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">SkillPath</h1>
                </div>

                <div className="mb-8 text-center">
                    <h2 className="text-xl font-semibold text-white mb-2">Welcome</h2>
                    <p className="text-sm text-gray-400">Sign up to continue your progress.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Name Input */ }
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-400">
                            Name
                        </label>
                        <input
                            type="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#101218] border border-gray-700 text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#6B72E1] focus:ring-1 focus:ring-[#6B72E1] transition-all"
                            placeholder="Alex Rivera"
                            required
                        />
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-400">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#101218] border border-gray-700 text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#6B72E1] focus:ring-1 focus:ring-[#6B72E1] transition-all"
                            placeholder="alex.rivera@example.com"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-400">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#101218] border border-gray-700 text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#6B72E1] focus:ring-1 focus:ring-[#6B72E1] transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-400">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-[#101218] border border-gray-700 text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#6B72E1] focus:ring-1 focus:ring-[#6B72E1] transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {/* Mesaj de eroare */}
                    {eroare && (
                        <p className="text-[#FF5C5C] text-sm text-center font-medium bg-[#FF5C5C]/10 py-2 rounded-lg border border-[#FF5C5C]/20">
                            {eroare}
                        </p>
                    )}

                    {/* Mesaj de succes pentru confirmare email */}
                    {successMessage && (
                        <p className="text-[#5CFF8D] text-sm text-center font-medium bg-[#5CFF8D]/10 py-3 px-4 rounded-lg border border-[#5CFF8D]/20">
                            {successMessage}
                        </p>
                    )}

                    {/* Buton de Submit (culoarea mov din poza ta) */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#6B72E1] hover:bg-[#585ed6] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-[#6B72E1]/20 mt-4 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Creating account...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign Up</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>

                </form>

                <div className="mt-8 pt-6 border-t border-gray-800 text-center flex flex-col gap-3">
                    <p className="text-sm text-gray-400">
                        Already have an account? <a href="/login" className="text-[#6B72E1] hover:text-white font-medium transition-colors">Log In</a>
                    </p>
                </div>



            </div>
        </div>
    );
}