"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateAssessment } from "@/backend/user/generateAssessment";
import { Card } from "@/frontend/user/common/card";
import { Button } from "@/frontend/user/common/button";

type Category = { id: number; name: string };

export function NewTestForm({
    userId,
    categories,
    userLevel,
}: {
    userId: number;
    categories: Category[];
    userLevel: string;
}) {
    const router = useRouter();
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canStart = categoryId !== null;

    const handleStart = async () => {
        if (!categoryId) {
            setError("Pick a category!");
            return;
        }
        setLoading(true);
        setError(null);

        const res = await generateAssessment(userId, categoryId);

        setLoading(false);
        if (!res.success || !res.data) {
            setError(res.message ?? "Sorry, error at generating test.");
            return;
        }
        // navigate to the test runner page
        router.push(`/assessment/${res.data.assessmentId}`);
    };

    return (
        <Card className="space-y-6 p-6">
            <div>
                <h1 className="text-xl font-semibold">Start a new test</h1>
                <p className="text-sm text-muted-foreground">
                    Categories for your level: <span className="font-medium">{userLevel}</span>
                </p>
            </div>

            {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    There are no categories for your level yet.
                </p>
            ) : (
                <>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((c) => (
                                <Button
                                    key={c.id}
                                    variant={categoryId === c.id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCategoryId(c.id)}
                                >
                                    {c.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button onClick={handleStart} disabled={loading || !canStart}>
                        {loading ? "Loading..." : "Start test"}
                    </Button>
                </>
            )}
        </Card>
    );
}
