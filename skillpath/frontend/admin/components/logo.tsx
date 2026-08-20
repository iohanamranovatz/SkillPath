import React from "react";
import { Code2 } from "lucide-react";

interface LogoProps {
    label?: string;
    className?: string;
}

export function Logo({ label = "SkillPath", className = "" }: LogoProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Icon Badge */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm">
                <Code2 className="h-5 w-5" />
            </div>

            {/* Brand Name */}
            <span className="text-xl font-bold tracking-tight text-black">
        {label}
      </span>
        </div>
    );
}