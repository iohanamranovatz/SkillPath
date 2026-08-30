"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import signOut from "@/backend/auth/logout";

export default function AdminHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSignOut = () => {
        signOut();
        setIsOpen(false);
    };

    return (
        <header className="flex h-16 items-center justify-between border-b border-sidebar-border bg-sidebar px-8 text-sidebar-foreground relative">
            <div>
                <p className="text-sm text-muted-foreground">
                    Admin Dashboard
                </p>
            </div>

            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-sidebar-accent/50 transition-colors cursor-pointer focus:outline-none"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground">
                        A
                    </div>

                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-sidebar-foreground">
                            Administrator
                        </p>
                    </div>
                </button>

                {/* Dropdown Box */}
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-card p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-2 border-b border-white/10 sm:hidden">
                            <p className="text-sm font-medium text-foreground">Administrator</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}