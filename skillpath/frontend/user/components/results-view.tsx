import {useEffect, useState} from "react";
import {getAssessmentAnalytics, toggleResourceCompletion} from "@/backend/user/actions/getAssessmentAnalytics";
import {Award, CheckCircle2, AlertTriangle, BookOpen, ExternalLink} from "lucide-react";

export function ResultsView() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAnalytics() {
            try {
                const analytics = await getAssessmentAnalytics();
                setData(analytics);
            } catch (error) {
                console.error("Failed to load analytics: ", error);
            } finally {
                setLoading(false);
            }
        }
        loadAnalytics();
    }, []);

    const handleToggleResource = async (resourceId: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        setData((prev: any) => {
           if (!prev) return prev;

           return {
               ...prev,
               recommendedResources: (prev.recommendedResources || []).map((res:any) =>
                   res.id === resourceId ? { ...res, isCompleted: newStatus } : res
               ),
           };
        });

        await toggleResourceCompletion(resourceId, newStatus);
    }

    if (loading) {
        return (
          <div className="max-w-5xl mx-auto p-6 text-center text-muted-foreground">
              Loading analytics...
          </div>
        );
    }

    if (!data) {
        return (
            <div className="max-w-5xl mx-auto p-8 text-center border rounded-xl bg-card">
                <h2 className="text-xl font-semibold mb-2">No available results</h2>
                <p className="text-muted-foreground">Take a test to see your performance.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Rezultate & Analiză</h1>
                <p className="text-muted-foreground">Urmărește evoluția și ariile care necesită atenție.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-6 border rounded-xl bg-card flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <Award className="size-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Punctaj Obținut (Medie)</p>
                        <h2 className="text-3xl font-bold">{data.scoreTotal}%</h2>
                    </div>
                </div>

                <div className="p-6 border rounded-xl bg-card flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                        <CheckCircle2 className="size-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Nivel Estimat</p>
                        <h2 className="text-3xl font-bold capitalize">{data.estimatedLevel}</h2>
                    </div>
                </div>
            </div>

            <div className="p-6 border rounded-xl bg-card space-y-4">
                <h2 className="text-xl font-semibold">Scor pe Categorii</h2>
                <div className="space-y-4">
                    {(data.categoryScores || []).map((cat: any) => (
                        <div key={cat.id} className="space-y-1.5">
                            <div className="flex justify-between text-sm font-medium">
                                <span>{cat.name}</span>
                                <span className={cat.percentage < 60 ? "text-amber-500 font-bold" : ""}>
                                    {cat.percentage}%
                                </span>
                            </div>
                            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${
                                        cat.percentage < 60 ? "bg-amber-500" : "bg-primary"
                                    }`}
                                    style={{ width: `${cat.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {(data.weakAreas || []).length > 0 && (
                <div className="p-6 border border-amber-500/30 rounded-xl bg-amber-500/5 space-y-3">
                    <div className="flex items-center gap-2 font-semibold text-amber-500 text-lg">
                        <AlertTriangle className="size-5" />
                        <h2>Weak Areas Identificate (&lt; 60%)</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {data.weakAreas.map((area: any) => (
                            <span
                                key={area.id}
                                className="px-3 py-1 bg-background border border-amber-500/20 rounded-lg text-sm font-medium"
                            >
                                {area.name}: <strong className="text-amber-500">{area.percentage}%</strong>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {(data.recommendedResources || []).length > 0 && (
                <div className="p-6 border rounded-xl bg-card space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-lg">
                        <BookOpen className="size-5 text-primary" />
                        <h2>Recomandări de Învățare pentru Weak Areas</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Bifează resursele pe măsură ce le parcurgi pentru a-ți salva progresul.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {data.recommendedResources.map((res: any) => (
                            <div
                                key={res.id}
                                className={`p-4 border rounded-xl flex items-start gap-3 transition-colors ${
                                    res.isCompleted ? "bg-muted/40 opacity-75" : "hover:border-primary/50"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={res.isCompleted}
                                    onChange={() => handleToggleResource(res.id, res.isCompleted)}
                                    className="mt-1 size-4 accent-primary cursor-pointer shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`font-medium hover:underline flex items-center gap-1 text-sm ${
                                            res.isCompleted ? "line-through text-muted-foreground" : ""
                                        }`}
                                    >
                                        <span className="truncate">{res.title}</span>
                                        <ExternalLink className="size-3 shrink-0" />
                                    </a>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mt-0.5">
                                        {res.type}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}



        </div>
    );
}