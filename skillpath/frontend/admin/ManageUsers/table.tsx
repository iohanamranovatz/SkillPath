"use client";

import { User} from "@/frontend/admin/lib/types";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import {user} from "@/frontend/user/lib/mock-data";

interface Props {
    users: User[];
    onDelete?: (id: number) => void;
}

export default function UserTable({ users, onDelete }: Props) {
    const getLevelClass = (level: string) => {
        switch (level?.toLowerCase()) {
            case "senior": return "badge-diff-hard";
            case "mid": return "badge-diff-medium";
            case "junior": return "badge-diff-easy";
            default: return "bg-muted text-muted-foreground";
        }
    };

    return (
        <div className="data-table-container">
            <table className="data-table">
                <thead className="data-table-header">
                <tr>
                    <th className="data-table-th">Name</th>
                    <th className="data-table-th">Email</th>
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
                            <td className="py-3 px-4 font-medium">
                                <Link
                                    href={`/manageUsers/${u.id}`}
                                    className="hover:text-blue-400 hover:underline transition-colors"
                                >
                                    {u.name}
                                </Link>
                            </td>

                            <td className="data-table-td font-medium text-foreground">{u.name}</td>
                            <td className="data-table-td text-muted-foreground">{u.email}</td>
                            <td className="data-table-td">
                                <span className={`table-badge ${getLevelClass(u.estimated_level)}`}>
                                    {u.estimated_level}
                                </span>
                            </td>
                            <td className="data-table-td text-muted-foreground">
                                {u.assessments?.length ?? 0} completed
                            </td>
                            <td className="data-table-td text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        type="button"
                                        onClick={() => onDelete?.(u.id)}
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
    );
}