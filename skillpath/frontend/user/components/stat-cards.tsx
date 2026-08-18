import { TrendingUp, Minus } from "lucide-react"
import {stats} from "@/frontend/user/lib/mock-data";
import {Card} from "@/frontend/user/common/card";


export function StatCards() {
    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.label} className="gap-2 p-5">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-semibold tracking-tight">{stat.value}</p>
                    <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        {stat.trend === "up" ? (
                            <TrendingUp className="size-3.5 text-chart-3" />
                        ) : (
                            <Minus className="size-3.5" />
                        )}
                        <span className={stat.trend === "up" ? "text-chart-3" : ""}>{stat.delta}</span>
                    </p>
                </Card>
            ))}
        </div>
    )
}
