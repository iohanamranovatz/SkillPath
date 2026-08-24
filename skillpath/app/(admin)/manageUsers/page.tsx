"use client";

import { User} from "@/frontend/admin/lib/types";
import { MOCK_USERS } from "@/frontend/admin/lib/mock-data";
import UserToolbar from "@/frontend/admin/ManageUsers/toolbar";
import UserTable from "@/frontend/admin/ManageUsers/table";
import AdminSidebar from "@/frontend/admin/components/Sidebar";
import AdminHeader from "@/frontend/admin/components/Header";
import AdminFooter from "@/frontend/admin/components/Footer";
import { useMemo, useState } from "react";

export default function UserManagementPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [level, setLevel] = useState("all");
    const [users, setUsers] = useState<User[]>(MOCK_USERS);

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLevel = level === "all" || u.estimated_level.toLowerCase() === level.toLowerCase();
            return matchesSearch && matchesLevel;
        });
    }, [users, searchTerm, level]);

    const handleDelete = (id: number) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />

            <div className="flex flex-1 flex-col">
                <AdminHeader />

                <main className="flex-1 bg-background p-8 text-foreground">
                    <div className="relative flex h-full min-h-screen w-full flex-col bg-background text-foreground">
                        <div className="flex-1 overflow-y-auto p-2">

                            {/* Header Area */}
                            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
                                    <p className="text-muted-foreground mt-1 text-sm">Manage user accounts and track proficiency levels.</p>
                                </div>
                                <button className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30">
                                    + Add User
                                </button>
                            </div>

                            {/* Main Content Card */}
                            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card p-4 shadow-xl sm:p-6 backdrop-blur-xl">
                                <UserToolbar
                                    searchTerm={searchTerm}
                                    onSearchChange={setSearchTerm}
                                    level={level}
                                    onLevelChange={setLevel}
                                />
                                <UserTable users={filteredUsers} onDelete={handleDelete} />
                            </div>
                        </div>
                    </div>
                </main>
                <AdminFooter />
            </div>
        </div>
    );
}