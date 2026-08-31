"use client"

import { useRouter } from "next/navigation"
import { Play, Clock, ListChecks } from "lucide-react"
import { Card } from "@/frontend/user/common/card"
import { Button } from "@/frontend/user/common/button"
import { Progress } from "@/frontend/user/common/progress"
import {UserTest} from "@/frontend/user/components/tests-view";


export function ContinueCard({ test }: {test?: UserTest} ) {
    const router = useRouter()
    if (!test) {
        return null; // Or return a fallback UI if the user has no tests in progress
    }

    // Parse progress string (e.g., "20%") into a number for the progress bar, default to 0
    const progressValue = test.progress ? parseInt(test.progress.replace("%", ""), 10) : 0

    return (
        <Card className="gap-0 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.07] to-transparent p-0">
            <div className="flex flex-col gap-5 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-primary">Continue where you left off</p>
                        <h2 className="text-lg font-semibold text-balance">
                            {test.categories.join(", ") || `Assessment #${test.id}`}
                        </h2>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {/* Pass difficulty if present on your test object, or handle gracefully */}
                            <span className="inline-flex items-center gap-1">
                                <ListChecks className="size-4" />
                                {10 - progressValue/10} questions left
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Clock className="size-4" />
                            </span>
                        </div>
                    </div>
                    <Button
                        className="shrink-0"
                        onClick={() => router.push(`/assessment/${test.id}`)}
                    >
                        <Play className="size-4" />
                        Resume
                    </Button>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{test.progress || `${progressValue}%`}</span>
                    </div>
                    <Progress value={progressValue} />
                </div>
            </div>
        </Card>
    )
}