import { ChevronRight } from "lucide-react"

import { DifficultyBadge } from "./difficulty-badge"
import {Card, CardContent, CardHeader, CardTitle} from "@/frontend/user/common/card";
import {Button} from "@/frontend/user/common/button";

import {cn} from "@/frontend/user/lib/utils";
import {Difficulty, View} from "@/frontend/user/lib/mock-data";

type RecentResult = {
    id: number | string
    title: string
    topic: string
    difficulty: Difficulty
    score: number
    date: string
}

interface RecentResultsProps {
    results?: RecentResult[]
    onViewChange?: (view: View) => void
}

function scoreColor(score: number) {
    if (score >= 85) return "text-chart-3"
    if (score >= 70) return "text-chart-4"
    return "text-chart-5"
}


function RecentResults({ results = [], onViewChange }: RecentResultsProps) {
    return (
        <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recent results</CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => onViewChange?.("Results")}
                >
                    View all
                    <ChevronRight className="size-4" />
                </Button>
            </CardHeader>
            <CardContent className="px-2">
                {results.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No results yet. Complete a test to see it here.
                    </p>
                ) : (
                <ul className="flex flex-col">
                    {results.map((result) => (
                        <li key={result.id}>
                            <button className="flex w-full items-center gap-4 rounded-md px-4 py-3 text-left transition-colors hover:bg-muted">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{result.title}</p>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{result.topic}</span>
                                        <span aria-hidden>·</span>
                                        <span>{result.date}</span>
                                    </div>
                                </div>
                                <DifficultyBadge difficulty={result.difficulty as Difficulty} />
                                <span className={cn("w-12 text-right text-base font-semibold tabular-nums", scoreColor(result.score))}>
                  {result.score}%
                </span>
                            </button>
                        </li>
                    ))}
                </ul>
                )}
            </CardContent>
        </Card>
    )
}

export default RecentResults
