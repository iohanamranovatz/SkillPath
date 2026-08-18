"use client"

import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/frontend/user/common/card";
import {scoreHistory} from "@/frontend/user/lib/mock-data";

export function ScoreChart() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Average score over time</CardTitle>
                <CardDescription>Your rolling test performance across the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={scoreHistory} margin={{ left: -20, right: 8, top: 8 }}>
                            <defs>
                                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                            />
                            <YAxis
                                domain={[40, 100]}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                            />
                            <Tooltip
                                cursor={{ stroke: "var(--border)" }}
                                contentStyle={{
                                    background: "var(--popover)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "var(--radius)",
                                    color: "var(--popover-foreground)",
                                    fontSize: 12,
                                }}
                                formatter={(value: number) => [`${value}%`, "Avg score"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="var(--chart-1)"
                                strokeWidth={2}
                                fill="url(#scoreFill)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
