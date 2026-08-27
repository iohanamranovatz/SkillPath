"use client";

import { User} from "@/frontend/admin/lib/types";
import { MOCK_USERS } from "@/frontend/admin/lib/mock-data";
import UserToolbar from "@/frontend/admin/ManageUsers/toolbar";
import UserTable from "@/frontend/admin/ManageUsers/table";
import AdminSidebar from "@/frontend/admin/components/Sidebar";
import AdminHeader from "@/frontend/admin/components/Header";
import AdminFooter from "@/frontend/admin/components/Footer";
import {useEffect, useMemo, useState} from "react";
import supabase from "@/helper/SupabaseClient";
import AddUserModal from "@/frontend/admin/ManageUsers/AddUserModal";
import Pagination from "@/frontend/components/pagination";
import {updateUserRole} from "@/backend/admin/actions/roleChange";

const ITEMS_PER_PAGE = 7;

export default function UserManagementPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [level, setLevel] = useState("all");

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // filtru de rol ('all', 'user', 'admin')
    const [roleFilter, setRoleFilter] = useState<string>("all");

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            // .ilike("role", "user");

        if (error) {
            console.log("Error getting users from database: ", error.message);
        } else {
            if (data){
                setUsers(data);
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    const handleRoleChange = async (userId: number, newRole: string) => {
        const res = await updateUserRole(userId, newRole);

        if (res.success) {
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === userId ? { ...user, role: newRole } : user
                )
            );
        } else {
            alert(res.message || "Could not change role!");
        }
    };

    // filtrare -> Search + Level + Role
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {

            const matchesSearch =
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesLevel =
                level === "all" ||
                u.estimated_level.toLowerCase() === level.toLowerCase();

            const matchesRole =
                roleFilter === "all" || (u.role || "user") === roleFilter;

            return matchesSearch && matchesLevel && matchesRole;
        });
    }, [users, searchTerm, level, roleFilter]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;

    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    const handleDelete = async (id: number) => {
        const { error } = await supabase
            .from("users")
            .delete()
            .eq("id", id);

        if (error) {
            console.log(`Error deleting user with ID: ${id}, `, error.message);
            return;
        }

        setUsers((prev) => prev.filter((u) => u.id !== id));
    };

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col bg-background text-foreground">
            <div className="flex-1 overflow-y-auto p-2">

                {/* Header Area */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Manage user accounts and track proficiency levels.</p>
                    </div>
                    <button
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        + Add User
                    </button>
                </div>

                {/* Main Content Card */}
                <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card p-4 shadow-xl sm:p-6 backdrop-blur-xl">
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <div className="flex-1 w-full">
                            <UserToolbar
                                searchTerm={searchTerm}
                                onSearchChange={(val) => {
                                    setSearchTerm(val);
                                    setCurrentPage(1);
                                }}
                                level={level}
                                onLevelChange={(val) => {
                                    setLevel(val);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        {/* Dropdown Filtru Rol */}
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="h-10 rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="all">All Roles</option>
                            <option value="user">Users</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>

                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading users...</p>
                    ) : (
                        <div className="space-y-4">
                            <UserTable
                                users={paginatedUsers}
                                onDelete={handleDelete}
                                onRoleChange={handleRoleChange}
                            />

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredUsers.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            <AddUserModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onUserAdded={(newUser: any) => setUsers((prev: any) => [newUser, ...prev])}
            />
        </div>
    );
}