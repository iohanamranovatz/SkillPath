"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    HelpCircle,
    FolderTree,
    Users,
    Menu,
    LogOut,
} from "lucide-react";
import { Logo } from "./logo";

const navItems = [
    { label: "Dashboard", href: "/adminDashboard", icon: LayoutDashboard },
    { label: "Question bank", href: "/questions", icon: HelpCircle },
    { label: "Manage bategories", href: "/categories", icon: FolderTree },
    { label: "Manage users", href: "/manageUsers", icon: Users },
];


export default function AdminSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    return (
        <aside
            className={`hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out lg:flex ${
                collapsed ? "w-[72px]" : "w-[260px]"
            }`}
        >
            {/* Header / Toggle Button Area */}
            <div className="flex h-16 items-center gap-2 px-3 border-b border-sidebar-border">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground shrink-0"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="size-5" />
                </button>

                {!collapsed && (
                    <div className="flex items-center overflow-hidden">
                        <Logo />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col gap-1.5 p-3" aria-label="Main navigation">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                            title={collapsed ? item.label : undefined}
                            className={`flex h-11 items-center gap-3 rounded-full px-3.5 text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                            } ${collapsed ? "justify-center px-0" : ""}`}
                        >
                            <Icon className="size-5 shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>

                    );
                })}
            </nav>


            {/* Logout Button (Poziționat jos în sidebar, stilizat identic cu restul elementelor) */}
            <div className="p-3 border-t border-sidebar-border">

            </div>
        </aside>
    );
}