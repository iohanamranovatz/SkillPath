import React from "react";
import { Award } from "lucide-react";
import type { TopUser } from "@/frontend/admin/lib/mock-data";

type MostProlificUsersCardProps = {
    users: TopUser[];
};

export function MostProlificUsersCard({ users }: MostProlificUsersCardProps) {
    return (
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex items-center justify-between pb-4">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
                        Most Prolific Users
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Top learners ranked by completed assessments
                    </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Award className="h-5 w-5" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            <th className="pb-3 pl-2">Rank</th>
                            <th className="pb-3">User</th>
                            <th className="pb-3">Email</th>
                            <th className="pb-3 pr-2 text-right">Assessments</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                className="group transition-colors hover:bg-muted/50"
                            >
                                <td className="py-3.5 pl-2">
                                    <span
                                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                            user.rank === 1
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {user.rank}
                                    </span>
                                </td>

                                <td className="py-3.5 font-medium text-card-foreground">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
                                            {user.name.charAt(0)}
                                        </div>
                                        <span>{user.name}</span>
                                    </div>
                                </td>

                                <td className="py-3.5 text-muted-foreground">
                                    {user.email}
                                </td>

                                <td className="py-3.5 pr-2 text-right">
                                    <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                                        {user.count} completed
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}