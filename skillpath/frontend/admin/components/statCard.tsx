import { TrendingUp } from "lucide-react";

type StatCardProps = {
    title: string;
    value: string | number;
    change: string;
};

export function StatCard({ title, value, change }: StatCardProps) {
    return (
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-all hover:border-border/80">
            {/* Title / Label */}
            <p className="text-sm font-normal text-muted-foreground">
                {title}
            </p>

            {/* Stat Value & Trend */}
            <div className="mt-4 space-y-2">
                <p className="text-4xl font-bold tracking-tight text-card-foreground">
                    {value}
                </p>

                <div className="flex items-center gap-1.5 text-xs font-medium text-chart-3">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                    <span>{change}</span>
                </div>
            </div>
        </div>
    );
}