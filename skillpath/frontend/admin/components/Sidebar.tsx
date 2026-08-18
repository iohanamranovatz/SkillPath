"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    HelpCircle,
    FolderTree,
    Users,
    Settings,
} from "lucide-react";
import { Logo } from "@/frontend/admin/components/logo";

const navItems = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Manage Questions", icon: HelpCircle },
    { label: "Manage Categories", icon: FolderTree },
    { label: "Manage Users", icon: Users },
];

export default function AdminSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [active, setActive] = useState("Dashboard");

    return (
        <aside
            className={`hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:flex ${
                collapsed ? "w-16" : "w-60"
            }`}
        >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
                {!collapsed && (
                    <div>
                        <Logo label="Codewell" />
                        <p className="text-xs text-muted-foreground"></p>
                    </div>
                )}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    aria-label="Toggle sidebar"
                >
                    ☰
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Main navigation">
                {navItems.map((item) => {
                    const isActive = active === item.label;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => setActive(item.label)}
                            aria-current={isActive ? "page" : undefined}
                            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                            }`}
                        >
                            <Icon className="size-[18px] shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="border-t border-sidebar-border p-4">
                <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                >
                    <Settings className="size-[18px] shrink-0" />
                    {!collapsed && <span>Settings</span>}
                </button>
            </div>
        </aside>
    );
}