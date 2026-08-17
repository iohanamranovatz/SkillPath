import {Sidebar} from "@/frontend/user/components/sidebar";
import {Topbar} from "@/frontend/user/components/topbar";
import {GreetingHeader} from "@/frontend/user/components/greeting-header";
import {StatCards} from "@/frontend/user/components/stat-cards";
import {ContinueCard} from "@/frontend/user/components/continue-card";
import {ScoreChart} from "@/frontend/user/components/score-chart";
import {SkillRadar} from "@/frontend/user/components/skill-radar";
import RecentResults from "@/frontend/user/components/recent-results";
import {RecommendedResources} from "@/frontend/user/components/recommended-resources";


export default function UserDashboardUI() {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar />
                <main className="flex-1 space-y-6 p-4 md:p-6">
                    <GreetingHeader />
                    <StatCards />
                    <ContinueCard />

                    <div className="grid gap-6 lg:grid-cols-2">
                        <ScoreChart />
                        <SkillRadar />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <RecentResults />
                        <RecommendedResources />
                    </div>
                </main>
            </div>
        </div>
    )
}
