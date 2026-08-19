import { ChevronRight, Sparkles } from "lucide-react"
import { PageHeading } from "./page-heading"
import { DifficultyBadge } from "./difficulty-badge"
import { tests } from "@/frontend/user/lib/mock-data"
import { Card } from "@/frontend/user/common/card"
import { Button } from "@/frontend/user/common/button"

export function TestsView({ onStart }: { onStart: () => void }) {
    return (
        <div className="space-y-6">
            <PageHeading
                title="Tests"
                description="Sharpen your skills with focused coding and algorithm challenges."
                action={
                    <Button onClick={onStart}>
                        <Sparkles className="size-4" />
                        Start a test
                    </Button>
                }
            />

            <div className="flex gap-2 overflow-x-auto">
                <Button size="sm">All tests</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">Coding</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">Algorithms</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">Completed</Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {tests.map((test) => (
                    <Card key={test.id} className="flex flex-col justify-between p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-3">
                                <DifficultyBadge difficulty={test.difficulty} />
                                <h2 className="text-lg font-semibold">{test.title}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {test.category} · {test.questions} questions · {test.time}
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
        </div>
    )
}
