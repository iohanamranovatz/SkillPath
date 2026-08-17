import { Sparkles, Trophy } from "lucide-react"
import {user} from "@/frontend/user/lib/mock-data";
import {Button} from "@/frontend/user/common/button";


export function GreetingHeader() {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-balance">
                    Welcome back, {user.name.at(0)}
                </h1>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Trophy className="size-4 text-primary" />
              {user.rank} of learners
          </span>
                    <span aria-hidden>·</span>
                    <span>
            Level: <span className="font-medium text-foreground">{user.level}</span>
          </span>
                </p>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="outline">View progress</Button>
                <Button>
                    <Sparkles className="size-4" />
                    Start a test
                </Button>
            </div>
        </div>
    )
}
