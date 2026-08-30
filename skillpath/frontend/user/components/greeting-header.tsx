import { Sparkles, Trophy } from "lucide-react"
import { user } from "@/frontend/user/lib/mock-data"
import { Button } from "@/frontend/user/common/button"

export function GreetingHeader({name, level, onStart}: {name: string, level: string, onStart?: [() => void, () => void] }) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-balance">
                    Welcome back, {name.split(" ")[0]}
                </h1>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span>
                        Level:
                        <span className="font-medium text-foreground">{" " + level}</span>
                    </span>
                </p>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onStart?.[0]}>View progress</Button>
                <Button onClick={onStart?.[1]}>
                    <Sparkles className="size-4" />
                    Start a test
                </Button>
            </div>
        </div>
    )
}
