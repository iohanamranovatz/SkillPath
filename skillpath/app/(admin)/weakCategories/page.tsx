"use client";

import { useEffect, useState } from "react";
import { getWeakCategories,  } from "@/backend/admin/getWeakCategories";
import {WeakCategory} from "@/frontend/admin/lib/types";

export default function WeakCategoriesCard() {
    const [categories, setCategories] = useState<WeakCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const data = await getWeakCategories();
            setCategories(data);
            setLoading(false);
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="rounded-2xl border border-white/10 bg-card p-6 shadow-xl">
                <p className="text-sm text-muted-foreground">Loading weak categories...</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-card p-6 shadow-xl space-y-4">
            <div>
                <h2 className="text-lg font-bold text-foreground">Weak Categories & Analytics</h2>
                <p className="text-xs text-muted-foreground">The areas where students struggle the most</p>
            </div>

            {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not enough data to generate statistics yet.</p>
            ) : (
                <div className="space-y-4">
                    {categories.slice(0, 5).map((cat) => (
                        <div key={cat.categoryId} className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-foreground">{cat.categoryName}</span>
                                <span className="text-xs font-semibold text-red-400">
                  {cat.errorPercentage}% Wrong ({cat.wrongAnswersCount}/{cat.totalAnswersCount})
                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                                <div
                                    className="h-full bg-red-500/80 transition-all duration-500"
                                    style={{ width: `${cat.errorPercentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}