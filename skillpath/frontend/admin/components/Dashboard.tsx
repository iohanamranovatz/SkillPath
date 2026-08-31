import { StatCard } from "./statCard";
import { AssessmentActivityCard } from "./activityCard";
import { MostProlificUsersCard } from "./remarkableUsers";
import { WeakestCategoriesCard } from "./weakCategories";
import type {
    AssessmentActivityItem,
    DashboardStat,
    TopUser,
    WeakCategory,
} from "@/frontend/admin/lib/mock-data";

type DashboardProps = {
    stats: DashboardStat[];
    assessmentActivity: AssessmentActivityItem[];
    topUsers: TopUser[];
    weakestCategories: WeakCategory[];
};

export default function Dashboard({
    stats,
    assessmentActivity,
    topUsers,
    weakestCategories,
}: DashboardProps) {
    return (
        <main className="flex-1 text-foreground">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="mt-1 text-sm text-muted-foreground">SkillPath Admin Overview</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <StatCard
                            key={stat.title}
                            title={stat.title}
                            value={stat.value}
                            change={stat.change}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <AssessmentActivityCard items={assessmentActivity} />
                    <WeakestCategoriesCard categories={weakestCategories} />
                </div>

                <MostProlificUsersCard users={topUsers} />
            </div>
        </main>
    );
}