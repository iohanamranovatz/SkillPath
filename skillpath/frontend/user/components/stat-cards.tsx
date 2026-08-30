import { TrendingUp, CheckCircle2, Circle } from "lucide-react"

export interface Objective {
    id: number;
    title: string;
    is_completed: boolean;
}

interface StatCardsProps {
    testsCompleted?: number;
    problemsSolved?: number;
    objectives?: Objective[];
}

export function StatCards({
                              testsCompleted,
                              problemsSolved,
                              objectives = []
                          }: StatCardsProps) {

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

            {/* Card 1: Tests Completed */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">Tests completed</p>
                <div className="mt-3 flex flex-col gap-1">
                    <p className="text-3xl font-semibold tracking-tight text-foreground">
                        {testsCompleted}
                    </p>
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                        <TrendingUp className="size-3.5" />
                        <span>+4 this week</span>
                    </div>
                </div>
            </div>

            {/* Card 2: Problems Solved */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">Problems solved</p>
                <div className="mt-3 flex flex-col gap-1">
                    <p className="text-3xl font-semibold tracking-tight text-foreground">
                        {problemsSolved}
                    </p>
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                        <TrendingUp className="size-3.5" />
                        <span>+10 this week</span>
                    </div>
                </div>
            </div>

            {/* Card 3: Current Objectives (Double Width) */}
            <div className="col-span-2 flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-medium text-muted-foreground mb-4">Current Objectives</p>

                <div className="flex flex-col gap-3">
                    {objectives.length > 0 ? (
                        objectives.slice(0, 3).map((objective) => (
                            <div key={objective.id} className="flex items-center gap-3">
                                {objective.is_completed ? (
                                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                                ) : (
                                    <Circle className="size-4 shrink-0 text-muted-foreground" />
                                )}
                                <p className={`text-sm truncate ${
                                    objective.is_completed
                                        ? "text-muted-foreground line-through"
                                        : "text-foreground font-medium"
                                }`}>
                                    {objective.title}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            No objectives set right now.
                        </p>
                    )}
                </div>
            </div>

        </div>
    )
}