import {AlertTriangle, BookOpen, Check, ChevronRight} from "lucide-react"
import { PageHeading } from "./page-heading"
import { StatCards } from "./stat-cards"
import { Card } from "@/frontend/user/common/card"
import {getAssessmentAnalytics, getLatestAssessmentAnalytics} from "@/backend/user/results/getAssessmentAnalytics";
import {useEffect, useState} from "react";
import {tests} from "@/frontend/user/lib/mock-data";

export function ResultsView() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const res = await getLatestAssessmentAnalytics();
            setData(res);
            setLoading(false);
        }
        loadData();
    }, []);

    if (loading) {
        return <div className="p-6 text-sm text-muted-foreground">Loading analytics...</div>
    }

    // verificam daca user-ul are sau nu completate teste -> pt UI
    const hasCompletedTests = data?.totalCompletedTests > 0;

    return (
        <div className="space-y-6">
            <PageHeading
                title="Results"
                description="Track your progress and understand where to focus next."
            />

            {/* Cardurile cu statistici generale */}
            {/*<StatCards stats={data?.stats}/>*/}

            {/* DACA NU ARE TESTE: Afisam un mesaj prietenos (Empty State) */}
            {!hasCompletedTests && data.weakAreas.length === 0 && (
                <Card className="p-8 text-center">
                    <h3 className="text-lg font-semibold">No test results yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Take your first assessment to unlock analytics, identify weak areas, and get personalized recommendations.
                    </p>
                </Card>
            )}

            {/* SECTIUNEA 1: Weak Areas */}
            {data.weakAreas.length > 0 && (
                <Card className="p-6 border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-center gap-2 font-semibold text-amber-500">
                        <AlertTriangle className="size-5" />
                        <h2>Weak Areas Identified</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        You scored below 60% on these topics. Focus on them to improve!
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                        {data.weakAreas.map((area) => (
                            <div
                                key={area.id}
                                className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-background px-3 py-2 text-sm font-medium"
                            >
                                <span>{area.name}</span>
                                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-500">
                                    {area.percentage}%
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* SECTIUNEA 2: Recommended Resources */}
            {data.recommendedResources.length > 0 && (
                <Card className="p-6">
                    <div className="flex items-center gap-2 font-semibold">
                        <BookOpen className="size-5 text-primary" />
                        <h2>Recommended Learning Resources</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Curated materials to help you cover your weak spots.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {data.recommendedResources.map((resource: any) => (
                            <a
                                key={resource.id}
                                href={resource.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
                            >
                                <div>
                                    <p className="font-medium">{resource.title}</p>
                                    <span className="text-xs uppercase text-muted-foreground">
                                        {resource.type}
                                    </span>
                                </div>
                                <ChevronRight className="size-4 text-muted-foreground" />
                            </a>
                        ))}
                    </div>
                </Card>
            )}

            {/* SECTIUNEA 3: Recent Attempts (Lista Teste) */}
            <Card className="overflow-hidden p-0">
                <div className="border-b border-border p-6">
                    <h2 className="text-base font-semibold">Recent attempts</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Your latest test performance</p>
                </div>
                <div className="divide-y divide-border">
                    {/* aici se poate mapa peste testele preluate din BD în loc de mock-data */}
                </div>
            </Card>
        </div>
    )
}
