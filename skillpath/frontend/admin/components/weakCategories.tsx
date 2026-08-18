import { AlertTriangle } from "lucide-react";

// TODO: Replace mock data with category performance calculated/retrieved
// from the backend based on aggregated assessment results.
const WEAKEST_CATEGORIES = [
    { id: "database", label: "Database", percentage: 68 },
    { id: "backend", label: "Backend", percentage: 54 },
    { id: "devops", label: "DevOps", percentage: 41 },
    { id: "frontend", label: "Frontend", percentage: 32 },
    { id: "testing", label: "Testing", percentage: 21 },
];

type Severity = "high" | "medium" | "low";

function getSeverity(percentage: number): Severity {
    if (percentage >= 60) return "high";
    if (percentage >= 35) return "medium";
    return "low";
}

const BAR_COLOR: Record<Severity, string> = {
    high: "bg-destructive",
    medium: "bg-chart-4",
    low: "bg-chart-3",
};

const BADGE_COLOR: Record<Severity, string> = {
    high: "bg-destructive/10 text-destructive",
    medium: "bg-chart-4/15 text-chart-4",
    low: "bg-chart-3/15 text-chart-3",
};

export function WeakestCategoriesCard() {
    return (
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-all hover:border-border/80">
            {/* Header */}
            <div className="flex items-center justify-between pb-5">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
                        Weakest Categories
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Categories where students perform poorly most often
                    </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <AlertTriangle className="h-5 w-5" />
                </div>
            </div>

            {/* Category list, sorted weakest -> strongest */}
            <ul className="space-y-3">
                {WEAKEST_CATEGORIES.map((category) => {
                    const severity = getSeverity(category.percentage);

                    return (
                        <li
                            key={category.id}
                            className="-mx-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted/50"
                        >
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                <span className="text-sm text-card-foreground">
                                    {category.label}
                                </span>
                                <span
                                    className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-semibold ${BADGE_COLOR[severity]}`}
                                >
                                    {category.percentage}%
                                </span>
                            </div>

                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${BAR_COLOR[severity]}`}
                                    style={{ width: `${category.percentage}%` }}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}