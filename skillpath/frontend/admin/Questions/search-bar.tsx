"use client";

import { Search, X } from "lucide-react";

type SearchBarProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export function SearchBar({
                              value,
                              onChange,
                              placeholder = "Search...",
                              className = "",
                          }: SearchBarProps) {
    return (
        <div className={`relative w-full ${className}`}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-9 text-sm text-card-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
            />

            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
}