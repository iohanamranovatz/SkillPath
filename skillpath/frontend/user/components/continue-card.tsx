import { Play, Clock, ListChecks } from "lucide-react"
import { DifficultyBadge } from "./difficulty-badge"
import {Card} from "@/frontend/user/common/card";
import {Button} from "@/frontend/user/common/button";
import {continueTest} from "@/frontend/user/lib/mock-data";
import {Progress} from "@/frontend/user/common/progress";


export function ContinueCard() {
    return (
        <Card className="gap-0 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.07] to-transparent p-0">
            <div className="flex flex-col gap-5 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-primary">Continue where you left off</p>
                        <h2 className="text-lg font-semibold text-balance">{continueTest.title}</h2>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <DifficultyBadge difficulty={continueTest.difficulty} />
                            <span className="inline-flex items-center gap-1">
                <ListChecks className="size-4" />
                                {continueTest.questionsLeft} left
              </span>
                            <span className="inline-flex items-center gap-1">
                <Clock className="size-4" />
                                {continueTest.estMinutes} min
              </span>
                        </div>
                    </div>
                    <Button className="shrink-0">
                        <Play className="size-4" />
                        Resume
                    </Button>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{continueTest.progress}%</span>
                    </div>
                    <Progress value={continueTest.progress} />
                </div>
            </div>
        </Card>
    )
}
