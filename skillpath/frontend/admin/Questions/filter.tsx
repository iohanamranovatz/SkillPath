"use client";

type Option = {
    label: string;
    value: string;
};

type FilterSelectProps = {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
};

export function FilterSelect({
                                 value,
                                 onChange,
                                 options,
                                 placeholder = "Select...",
                                 className = "",
                             }: FilterSelectProps) {
    return (
        <div className={`relative w-full ${className}`}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-card py-2 pl-3.5 pr-9 text-sm text-card-foreground transition-colors focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer shadow-sm"
            >
                {placeholder && (
                    <option value="" disabled hidden>
                        {placeholder}
                    </option>
                )}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-card text-card-foreground">
                        {opt.label}
                    </option>
                ))}
            </select>

            {/* Dropdown arrow icon */}
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    );
}