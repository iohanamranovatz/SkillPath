"use client"

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/frontend/user/common/card";

type SkillPoint = { skill: string; score: number }

export function SkillRadar({ data = [] }: { data?: SkillPoint[] }) {
    const strongest = data.length ? [...data].sort((a, b) => b.score - a.score)[0] : null
    const weakest = data.length ? [...data].sort((a, b) => a.score - b.score)[0] : null

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Skill breakdown</CardTitle>
                <CardDescription>
                    {strongest && weakest ? (
                        <>
                            Strongest in <span className="font-medium text-chart-3">{strongest.skill}</span>, focus on{" "}
                            <span className="font-medium text-chart-5">{weakest.skill}</span>
                        </>
                    ) : (
                        "Your performance across categories"
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-[260px] w-full items-center justify-center text-sm text-muted-foreground">
                        Complete a test to see your skill breakdown.
                    </div>
                ) : (
                <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={data} outerRadius="72%">
                            <PolarGrid stroke="var(--border)" />
                            <PolarAngleAxis
                                dataKey="skill"
                                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                            />
                            <Radar
                                name="Mastery"
                                dataKey="score"
                                stroke="var(--chart-1)"
                                fill="var(--chart-1)"
                                fillOpacity={0.25}
                                strokeWidth={2}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                )}
            </CardContent>
        </Card>
    )
}
