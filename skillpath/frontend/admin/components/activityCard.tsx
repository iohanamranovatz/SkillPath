import React from "react";
import { BarChart2 } from "lucide-react";
import type { AssessmentActivityItem } from "@/frontend/admin/lib/mock-data";

type AssessmentActivityCardProps = {
    items: AssessmentActivityItem[];
};

export function AssessmentActivityCard({ items }: AssessmentActivityCardProps) {
    const maxCount = Math.max(...items.map((d) => d.count), 1);

    return (
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex items-center justify-between pb-6">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
                        Assessment Activity
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Completed assessments over the last 7 days
                    </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <BarChart2 className="h-5 w-5" />
                </div>
            </div>

            <div className="flex h-52 items-end justify-between gap-3 sm:gap-6 pt-4">
                {items.map((item) => {
                    const heightPercentage = Math.round((item.count / maxCount) * 100);

                    return (
                        <div
                            key={item.day}
                            className="group flex flex-1 flex-col items-center h-full justify-end"
                        >
                            <span className="mb-2 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                                {item.count}
                            </span>

                            <div className="relative flex w-full max-w-[42px] flex-1 items-end rounded-t-lg bg-muted/60 p-1">
                                <div
                                    className="w-full rounded-t-md bg-primary transition-all duration-300 group-hover:opacity-85"
                                    style={{ height: `${heightPercentage}%` }}
                                />
                            </div>

                            <span className="mt-3 text-xs font-medium text-muted-foreground transition-colors group-hover:text-card-foreground">
                                {item.day}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}