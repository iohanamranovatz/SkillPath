"use client"

import { useState } from "react"
import { Sidebar } from "@/frontend/user/components/sidebar"
import { Topbar } from "@/frontend/user/components/topbar"
import { GreetingHeader } from "@/frontend/user/components/greeting-header"
import { StatCards } from "@/frontend/user/components/stat-cards"
import { ContinueCard } from "@/frontend/user/components/continue-card"
import { ScoreChart } from "@/frontend/user/components/score-chart"
import { SkillRadar } from "@/frontend/user/components/skill-radar"
import RecentResults from "@/frontend/user/components/recent-results"
import { RecommendedResources } from "@/frontend/user/components/recommended-resources"
import { TestsView } from "@/frontend/user/components/tests-view"
import { ResultsView } from "@/frontend/user/components/results-view"
import { ResourcesView } from "@/frontend/user/components/resources-view"
import { ProfileView } from "@/frontend/user/components/profile-view"
import type { View } from "@/frontend/user/lib/mock-data"
import {UserDashboardUIProps} from "@/frontend/user/lib/types";

function DashboardView({ onStart }: { onStart: () => void }) {
    return (
        <>
            <GreetingHeader onStart={onStart} />
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
        </>
    )
}

export function UserDashboardUI({
    initialData,
    objectives = [],
    userInterestTagIds = [],
    allTags = []
}: UserDashboardUIProps) {
    const [view, setView] = useState<View>("Dashboard")
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleViewChange = (next: View) => {
        setView(next)
        setMobileOpen(false)
    }

    const startTest = () => {
        setView("Tests")
        setMobileOpen(false)
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar
                activeView={view}
                onViewChange={handleViewChange}
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar onMenuOpen={() => setMobileOpen(true)} />
                <main className="flex-1 space-y-6 p-4 md:p-6">
                    {view === "Dashboard" && <DashboardView onStart={startTest} />}
                    {view === "Tests" && <TestsView onStart={startTest} />}
                    {view === "Results" && <ResultsView />}
                    {view === "Resources" && <ResourcesView />}
                    {view === "Profile" && (
                        <ProfileView
                            initialData={initialData}
                            objectives={objectives}
                            userInterestTagIds={userInterestTagIds}
                            allTags={allTags}
                        />
                    )}
                </main>
            </div>
        </div>
    )
}
