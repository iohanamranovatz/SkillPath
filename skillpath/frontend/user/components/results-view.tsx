import {useEffect, useState} from "react";
import {getAssessmentAnalytics, toggleResourceCompletion} from "@/backend/user/actions/getAssessmentAnalytics";
import {Award, CheckCircle2, AlertTriangle, BookOpen, ExternalLink, ChevronLeft, ChevronRight} from "lucide-react";

// paginare -> numarul de categorii per pagina
const ITEMS_PER_PAGE = 6;

export function ResultsView() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // paginare
    const [currentPage, setCurrentPage] = useState(1);

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

    const resourcesList = data.recommendedResources || [];
    const totalResourcesCount = resourcesList.length;
    const completedResourcesCount = resourcesList.filter((r: any) => r.isCompleted).length;
    const resourceProgressPercentage = totalResourcesCount > 0
        ? Math.round((completedResourcesCount / totalResourcesCount) * 100)
        : 0;

    // Calcule pentru paginarea resurselor
    const totalPages = Math.ceil(totalResourcesCount / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedResources = resourcesList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Results & Analytics</h1>
                <p className="text-muted-foreground">Track progress and areas that require attention.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-6 border rounded-xl bg-card flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <Award className="size-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Final Score (Average)</p>
                        <h2 className="text-3xl font-bold">{data.scoreTotal}%</h2>
                    </div>
                </div>

                <div className="p-6 border rounded-xl bg-card flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                        <CheckCircle2 className="size-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Estimated level</p>
                        <h2 className="text-3xl font-bold capitalize">{data.estimatedLevel}</h2>
                    </div>
                </div>
            </div>

            <div className="p-6 border rounded-xl bg-card space-y-4">
                <h2 className="text-xl font-semibold">Score per Category</h2>
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
                        <h2>Identified Weaknesses (&lt; 60%)</h2>
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
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 font-semibold text-lg">
                            <BookOpen className="size-5 text-primary" />
                            <h2>Learning Recommendations for Weak Areas</h2>
                        </div>

                        {/* Bara de progres resurse */}
                        <div className="space-y-1.5 bg-muted/30 p-4 rounded-xl border">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span className="text-muted-foreground">
                                    Progress of Completed Resources ({completedResourcesCount}/{totalResourcesCount})
                                </span>
                                <span className="font-bold text-primary">{resourceProgressPercentage}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${resourceProgressPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lista de resurse paginată */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        {paginatedResources.map((res: any) => (
                            <div
                                key={res.id}
                                className={`p-4 border rounded-xl flex items-center justify-between gap-3 transition-colors ${
                                    res.isCompleted ? "bg-muted/40 opacity-75 border-muted" : "hover:border-primary/50 bg-background"
                                }`}
                            >
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <input
                                        type="checkbox"
                                        checked={res.isCompleted}
                                        onChange={() => handleToggleResource(res.id, res.isCompleted)}
                                        className="mt-1 size-4 accent-primary cursor-pointer shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className={`font-medium text-sm truncate ${
                                            res.isCompleted ? "line-through text-muted-foreground" : ""
                                        }`}>
                                            {res.title}
                                        </p>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider block mt-0.5">
                                            {res.type}
                                        </span>
                                    </div>
                                </div>

                                <a
                                    href={res.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 border rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-1.5 shrink-0"
                                >
                                    <span>Open</span>
                                    <ExternalLink className="size-3" />
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* Controale de Paginare (se afișează doar dacă există mai mult de o pagină) */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t text-sm">
                            <span className="text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className="p-2 border rounded-lg bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border rounded-lg bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}