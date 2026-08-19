"use client";

import { useState } from 'react';
import { loginUser } from '@/backend/loginUser';
import Link from "next/link";

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [eroare, setEroare] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEroare('');

    const rezultat = await loginUser(email, password);

    if (rezultat && rezultat.succes === false) {
        setEroare(rezultat.message);
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
          <h2 className="text-xl font-semibold text-white mb-2">Welcome back</h2>
          <p className="text-sm text-gray-400">Log in to continue your progress.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
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

          {/* Mesaj de eroare */}
          {eroare && (
            <p className="text-[#FF5C5C] text-sm text-center font-medium bg-[#FF5C5C]/10 py-2 rounded-lg border border-[#FF5C5C]/20">
              {eroare}
            </p>
          )}

          {/* Buton de Submit (culoarea mov din poza ta) */}
          <button 
            type="submit" 
            className="w-full bg-[#6B72E1] hover:bg-[#585ed6] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-[#6B72E1]/20 mt-4 flex items-center justify-center gap-2"
          >
            <span>Log In</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          
        </form>

        {/* Link-uri extra inferioare */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-center flex flex-col gap-3">
          <a href="#" className="text-sm text-[#6B72E1] hover:text-white transition-colors">
            Forgot your password?
          </a>
          <p className="text-sm text-gray-400">
            Don't have an account? <a href="/signup" className="text-[#6B72E1] hover:text-white font-medium transition-colors">Sign up</a>
          </p>
        </div>

      </div>
    </div>
  );
}