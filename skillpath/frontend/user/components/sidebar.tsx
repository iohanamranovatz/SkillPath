"use client"

import { useState } from "react"
import {
    LayoutDashboard,
    FileCode2,
    BarChart3,
    BookOpen,
    User,
    Settings,
    Code2,
} from "lucide-react"
import {cn} from "@/frontend/user/lib/utils";



const nav = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Tests", icon: FileCode2, active: false },
    { label: "Results", icon: BarChart3, active: false },
    { label: "Resources", icon: BookOpen, active: false },
    { label: "Profile", icon: User, active: false },
]

export function Sidebar() {
    const [active, setActive] = useState("Dashboard")

    return (
        <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
            <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Code2 className="size-5" />
                </div>
                <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">SkillPath</span>
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Main navigation">
                {nav.map((item) => {
                    const isActive = active === item.label
                    return (
                        <button
                            key={item.label}
                            onClick={() => setActive(item.label)}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                            )}
                        >
                            <item.icon className="size-[18px]" />
                            {item.label}
                        </button>
                    )
                })}
            </nav>

            <div className="border-t border-sidebar-border p-4">
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground">
                    <Settings className="size-[18px]" />
                    Settings
                </button>
            </div>
        </aside>
    )
}
