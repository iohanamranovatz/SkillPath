"use client"

import {
    LayoutDashboard,
    FileCode2,
    BarChart3,
    BookOpen,
    User,
    Settings,
    Code2,
    X,
} from "lucide-react"
import { cn } from "@/frontend/user/lib/utils"
import type { View } from "@/frontend/user/lib/mock-data"

const nav: { label: View; icon: typeof LayoutDashboard }[] = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Tests", icon: FileCode2 },
    { label: "Results", icon: BarChart3 },
    { label: "Resources", icon: BookOpen },
    { label: "Profile", icon: User },
]

export function Sidebar({
    activeView,
    onViewChange,
    mobileOpen,
    onClose,
}: {
    activeView: View
    onViewChange: (view: View) => void
    mobileOpen: boolean
    onClose: () => void
}) {
    return (
        <>
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
                    mobileOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <Code2 className="size-5" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
                            SkillPath
                        </span>
                    </div>
                    <button
                        className="flex items-center justify-center text-muted-foreground lg:hidden"
                        onClick={onClose}
                        aria-label="Close menu"
                    >
                        <X className="size-5" />
                    </button>
                </div>
<<<<<<< HEAD
                <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">SkillPath</span>
            </div>
=======
>>>>>>> 30bc409 (fronted for the user done)

                <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Main navigation">
                    {nav.map(({ label, icon: Icon }) => {
                        const isActive = activeView === label
                        return (
                            <button
                                key={label}
                                onClick={() => onViewChange(label)}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                                )}
                            >
                                <Icon className="size-[18px]" />
                                {label}
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

            {mobileOpen && (
                <button
                    className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                    aria-label="Close menu"
                    onClick={onClose}
                />
            )}
        </>
    )
}
