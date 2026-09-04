"use client";

import { useState } from 'react';
import { resetPassword } from '@/backend/auth/resetPasswd';
import Link from "next/link";

export function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const result = await resetPassword(password);

        if (result && result.success === false) {
            setError(result.message);
        } else {
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#101218] p-4 text-gray-100 font-sans">
                <div className="w-full max-w-md bg-[#1C1F28] border border-gray-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="bg-[#6B72E1] p-2 rounded-xl flex items-center justify-center w-10 h-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-wide">SkillPath</h1>
                    </div>
                    <h2 className="text-xl font-semibold text-white">Password updated</h2>
                    <p className="text-sm text-gray-400">Your password has been successfully updated. You can now log in with your new credentials.</p>
                    <Link
                        href="/login"
                        className="w-full bg-[#6B72E1] hover:bg-[#585ed6] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-[#6B72E1]/20 inline-block text-center"
                    >
                        Go to Log In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#101218] p-4 text-gray-100 font-sans">

            <div className="w-full max-w-md bg-[#1C1F28] border border-gray-800 rounded-2xl p-8 shadow-2xl">

                {/* Brand logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="bg-[#6B72E1] p-2 rounded-xl flex items-center justify-center w-10 h-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">SkillPath</h1>
                </div>

                <div className="mb-8 text-center">
                    <h2 className="text-xl font-semibold text-white mb-2">Set new password</h2>
                    <p className="text-sm text-gray-400">Enter a new secure password for your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* New Password Input */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-400">
                            New Password
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
                            Confirm New Password
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

                    {/* Error message */}
                    {error && (
                        <p className="text-[#FF5C5C] text-sm text-center font-medium bg-[#FF5C5C]/10 py-2 rounded-lg border border-[#FF5C5C]/20">
                            {error}
                        </p>
                    )}

                    {/* Submit button */}
                    <button
                        type="submit"
                        className="w-full bg-[#6B72E1] hover:bg-[#585ed6] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-[#6B72E1]/20 mt-4 flex items-center justify-center gap-2"
                    >
                        <span>Update Password</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>

                </form>

                {/* Footer links */}
                <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                    <p className="text-sm text-gray-400">
                        Remembered your password? <Link href="/login" className="text-[#6B72E1] hover:text-white font-medium transition-colors">Log in</Link>
                    </p>
                </div>

            </div>
        </div>
    );
}