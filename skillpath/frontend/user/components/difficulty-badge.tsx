import { Difficulty } from "@/frontend/user/lib/mock-data";
import { cn } from "@/frontend/user/lib/utils";

const styles: { [key in Difficulty]: string } = {
    Easy: "border-chart-3/30 bg-chart-3/10 text-chart-3",
    Medium: "border-chart-4/30 bg-chart-4/10 text-chart-4",
    Hard: "border-chart-5/30 bg-chart-5/10 text-chart-5",
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                styles[difficulty],
            )}
        >
            {difficulty}
        </span>
    )
}