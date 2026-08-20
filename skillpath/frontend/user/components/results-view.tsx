import { Check, ChevronRight } from "lucide-react"
import { PageHeading } from "./page-heading"
import { StatCards } from "./stat-cards"
import { Card } from "@/frontend/user/common/card"
import { tests } from "@/frontend/user/lib/mock-data"

export function ResultsView() {
    return (
        <div className="space-y-6">
            <PageHeading
                title="Results"
                description="Track your progress and understand where to focus next."
            />

            <StatCards />

            <Card className="overflow-hidden p-0">
                <div className="border-b border-border p-6">
                    <h2 className="text-base font-semibold">Recent attempts</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Your latest test performance</p>
                </div>
                <div className="divide-y divide-border">
                    {tests.map((test, index) => (
                        <div
                            key={test.id}
                            className="flex flex-wrap items-center justify-between gap-4 px-6 py-5"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-primary">
                                    <Check className="size-[18px]" />
                                </div>
                                <div>
                                    <p className="font-medium">{test.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {index + 2} days ago · {test.questions} questions
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-sm text-muted-foreground">{test.difficulty}</span>
                                {test.score !== null && (
                                    <span className="text-lg font-semibold text-chart-3">{test.score}%</span>
                                )}
                                <ChevronRight className="size-[18px] text-muted-foreground" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}
