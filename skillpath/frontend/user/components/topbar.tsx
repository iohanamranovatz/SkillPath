"use client"

import { useState, useEffect, useRef } from "react"
import { Search, LayoutDashboard, LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/frontend/user/common/avatar"
import { Button } from "@/frontend/user/common/button"
import signOut from "@/backend/auth/logout";

export function Topbar({ data, onMenuOpen }: { data: {name: string, email: string} , onMenuOpen: () => void }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking anywhere outside of it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            window.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            window.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    const handleSignOut = () => {
        signOut();
        setIsDropdownOpen(false);
    };

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <button
                className="flex items-center justify-center text-foreground lg:hidden"
                onClick={onMenuOpen}
                aria-label="Open menu"
            >
                <LayoutDashboard className="size-5" />
            </button>

            {/*<div className="relative hidden max-w-sm flex-1 md:block">*/}
            {/*    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />*/}
            {/*    <input*/}
            {/*        type="search"*/}
            {/*        placeholder="Search tests, topics, resources..."*/}
            {/*        aria-label="Search"*/}
            {/*        className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"*/}
            {/*    />*/}
            {/*</div>*/}

            <div className="ml-auto flex items-center gap-3">
                {/* Attach ref here to monitor clicks inside vs outside */}
                <div className="relative" ref={dropdownRef}>
                    <Button
                        variant="ghost"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="h-auto p-1.5 justify-start gap-3 hover:bg-card/80 cursor-pointer"
                        aria-label="User menu"
                    >
                        <Avatar className="size-9 ring-1 ring-border">
                            <AvatarFallback className="bg-muted text-foreground font-medium">
                                {data.name.toUpperCase().slice(0, 1)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden leading-tight sm:block text-left">
                            <p className="text-sm font-medium text-foreground">{data.name}</p>
                            <p className="text-xs text-muted-foreground">{data.email}</p>
                        </div>
                    </Button>

                    {/* Dropdown Box */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                            <button
                                onClick={handleSignOut}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                            >
                                <LogOut className="size-4" />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}