import { StatCard } from "./statCard";
import { AssessmentActivityCard } from "./activityCard";
import { MostProlificUsersCard } from "./remarkableUsers";
import { WeakestCategoriesCard } from "./weakCategories";

export default function Dashboard() {
    return (
        <main className="flex-1 bg-background p-8 text-foreground">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="mt-1 text-sm text-muted-foreground">SkillPath Admin Overview</p>
                </div>

                {/* 1. Stat Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Students" value={128} change="+12 this mo." />
                    <StatCard title="Assessments" value={342} change="+24 this mo." />
                    <StatCard title="Questions" value={156} change="+8 this mo." />
                    <StatCard title="Categories" value={12} change="+2 this mo." />
                </div>

                {/* 2. Assessment Activity + Weakest Categories */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <AssessmentActivityCard />
                    <WeakestCategoriesCard />
                </div>

                {/* 3. Most Prolific Users Table */}
                <MostProlificUsersCard />
            </div>
        </main>
    );
}