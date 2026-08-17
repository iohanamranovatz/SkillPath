"use client"

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts"
import {skills} from "@/frontend/user/lib/mock-data";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/frontend/user/common/card";


export function SkillRadar() {
    const strongest = [...skills].sort((a, b) => b.score - a.score)[0]
    const weakest = [...skills].sort((a, b) => a.score - b.score)[0]

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Skill breakdown</CardTitle>
                <CardDescription>
                    Strongest in <span className="font-medium text-chart-3">{strongest.skill}</span>, focus on{" "}
                    <span className="font-medium text-chart-5">{weakest.skill}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={skills} outerRadius="72%">
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
            </CardContent>
        </Card>
    )
}
