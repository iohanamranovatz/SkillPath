
"use client"
import {useState} from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Sparkles } from "lucide-react"
import { PageHeading } from "./page-heading"
import { Card } from "@/frontend/user/common/card"
import { Button } from "@/frontend/user/common/button"

export type UserTest = {
    id: number
    categories: string[]
    questions: number
    score: number | null
    status: string
    startedAt: string | null
    completedAt: string | null
}

export function TestsView({ tests ,onStart }: { tests: UserTest[],onStart: () => void }) {
    const [activeFilter,setActiveFilter]=useState<string>("All tests")
    const router=useRouter();
    const categories = Array.from(new Set(tests.flatMap((t) => t.categories))) 
    const filters=["All tests", ...categories, "Completed"]
    
    const visibleTests=tests.filter((test) =>
    {
        if(activeFilter=="All tests") return true
        if(activeFilter=="Completed") return test.score!=null
        return test.categories.includes(activeFilter)
    })

    return (
        <div className="space-y-6">
            <PageHeading
                title="Tests"
                description="Sharpen your skills with focused coding and algorithm challenges."
                action={
    <Button onClick={() => router.push("/assessment/new")}>
        <Sparkles className="size-4" />
        Start a test
    </Button>
}
            />

            <div className="flex gap-2 overflow-x-auto">
                {filters.map((filter) => {
                    const isActive = activeFilter === filter
                    return (
                        <Button
                            key={filter}
                            size="sm"
                            variant={isActive ? "default" : "ghost"}
                            className={isActive ? undefined : "text-muted-foreground"}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter}
                        </Button>
                    )
                })}
            </div>

            {visibleTests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tests in this category yet.</p>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {visibleTests.map((test) => (
                        <Card key={test.id} className="flex flex-col justify-between p-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-3">
                                    <h2 className="text-lg font-semibold">
                                        {test.categories.join(", ") || `Test #${test.id}`}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {test.questions} questions
                                    </p>
                                </div>
                                {test.score !== null && (
                                    <span className="text-xl font-semibold text-chart-3">{test.score}%</span>
                                )}
                            </div>
                            <div className="mt-6 flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    {test.score === null ? "Not started yet" : "Completed"}
                                </span>
                                <Button variant="outline" size="sm">
                                    {test.score === null ? "Take test" : "Review"}
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )      
}
