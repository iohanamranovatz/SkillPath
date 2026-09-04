"use client";

import { useState } from "react";
import { User} from "@/frontend/admin/lib/types";
import {Eye, Trash2} from "lucide-react";
import Link from "next/link";
import ConfirmDialog from "@/frontend/components/confirm-dialog";

interface Props {
    users: User[];
    onDelete?: (id: number) => void;
    onRoleChange?: (id: number, newRole: string) => void;
}

export default function UserTable({ users, onDelete, onRoleChange }: Props) {
    // confirmari (dialoguri proprii, nu confirm() nativ)
    const [pendingRole, setPendingRole] = useState<{ user: User; newRole: string } | null>(null);
    const [toDelete, setToDelete] = useState<User | null>(null);
    const [busy, setBusy] = useState(false);

    const confirmRoleChange = async () => {
        if (!pendingRole) return;
        setBusy(true);
        await onRoleChange?.(pendingRole.user.id, pendingRole.newRole);
        setBusy(false);
        setPendingRole(null);
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        setBusy(true);
        await onDelete?.(toDelete.id);
        setBusy(false);
        setToDelete(null);
    };

    const getLevelClass = (level: string) => {
        switch (level?.toLowerCase()) {
            case "advanced":
            case "senior": // valoare veche, pastrata pentru randurile deja existente
                return "badge-diff-hard";
            case "intermediate":
            case "mid": // valoare veche, pastrata pentru randurile deja existente
                return "badge-diff-medium";
            case "beginner":
            case "junior": // valoare veche, pastrata pentru randurile deja existente
                return "badge-diff-easy";
            default: return "bg-muted text-muted-foreground";
        }
    };

    return (
        <>
        <div className="data-table-container">
            <table className="data-table">
                <thead className="data-table-header">
                <tr>
                    <th className="data-table-th">Name</th>
                    <th className="data-table-th">Email</th>
                    <th className="data-table-th">Role</th>
                    <th className="data-table-th">Estimated Level</th>
                    <th className="data-table-th">Assessments Count</th>
                    <th className="data-table-th text-right">Actions</th>
                </tr>
                </thead>
                <tbody>
                {users.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="h-24 text-center text-muted-foreground">
                            No users found.
                        </td>
                    </tr>
                ) : (
                    users.map((u) => (
                        <tr key={u.id} className="data-table-row">
                            {/* Name */}
                            <td className="py-3 px-4 font-medium">
                                <Link
                                    href={`/manageUsers/${u.id}`}
                                    className="hover:text-blue-400 hover:underline transition-colors"
                                >
                                    {u.name}
                                </Link>
                            </td>

                            {/* Email */}
                            <td className="data-table-td text-muted-foreground">{u.email}</td>

                            {/* Role Dropdown */}
                            <td className="data-table-td">
                                <select
                                    value={u.role || "user"}
                                    onChange={(e) => {
                                        // select controlat -> valoarea revine singura daca se anuleaza
                                        setPendingRole({ user: u, newRole: e.target.value });
                                    }}
                                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-foreground outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="user" className="bg-card text-foreground">user</option>
                                    <option value="admin" className="bg-card text-foreground">admin</option>
                                </select>
                            </td>

                            {/* Estimated Level */}
                            <td className="data-table-td">
                                <span className={`table-badge ${getLevelClass(u.estimated_level)}`}>
                                    {u.estimated_level}
                                </span>
                            </td>

                            {/* Assessments Count */}
                            <td className="data-table-td text-muted-foreground">
                                {u.assessments?.length ?? 0} completed
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Link
                                        href={`/manageUsers/${u.id}`}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        title="View User Details"
                                    >
                                        <Eye className="size-3.5" />
                                        <span>Details</span>
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => setToDelete(u)}
                                        aria-label={`Delete user ${u.id}`}
                                        className="group inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive active:scale-90"
                                    >
                                        <Trash2 className="size-4 transition-transform group-hover:scale-110" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>

        <ConfirmDialog
            open={pendingRole !== null}
            title="Change role?"
            tone="default"
            confirmLabel="Change role"
            busyLabel="Changing…"
            busy={busy}
            message={
                <>
                    Sigur vrei să schimbi rolul lui{" "}
                    <span className="font-medium text-foreground">{pendingRole?.user.name}</span> în{" "}
                    <span className="font-medium text-foreground">{pendingRole?.newRole}</span>?
                </>
            }
            onConfirm={confirmRoleChange}
            onCancel={() => setPendingRole(null)}
        />

        <ConfirmDialog
            open={toDelete !== null}
            title="Delete user?"
            confirmLabel="Delete"
            busyLabel="Deleting…"
            busy={busy}
            message={
                <>
                    Sigur vrei să ștergi contul lui{" "}
                    <span className="font-medium text-foreground">{toDelete?.name}</span>? Acțiunea nu poate fi anulată.
                </>
            }
            onConfirm={confirmDelete}
            onCancel={() => setToDelete(null)}
        />
        </>
    );
}