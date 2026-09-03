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
import { TestsView, type UserTest } from "@/frontend/user/components/tests-view"
import { ResultsView } from "@/frontend/user/components/results-view"
import { ResourcesView } from "@/frontend/user/components/resources-view"
import { ProfileView } from "@/frontend/user/components/profile-view"
import type { View } from "@/frontend/user/lib/mock-data"
import {Objective, UserDashboardUIProps, UserProfileData} from "@/frontend/user/lib/types";
import type { DashboardData } from "@/backend/user/getDashboardData";



function DashboardView({initialData, tests, questions, objectives, dashboardData, onStart, onViewChange }: {initialData: UserProfileData, tests: UserTest[],
    questions: number, objectives: Objective[], dashboardData: DashboardData, onStart?: [() => void, () => void], onViewChange?: (view: View) => void}) {

    const regularTests = tests.filter((test: any) => !test.isInitial);

    return (
        <>
            <GreetingHeader  name={initialData.name}
                             level={initialData.estimated_level}
                             onStart={onStart}
            />
            <StatCards testsCompleted={tests.filter(test => test.status == "completed").length}
                       problemsSolved={questions}
                       objectives={objectives}
            />
            <ContinueCard test={regularTests.find(t => t.status == "in_progress")}/>

            <div className="grid gap-6 lg:grid-cols-2">
                <ScoreChart data={dashboardData.scoreHistory} />
                <SkillRadar data={dashboardData.skills} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <RecentResults
                    results={dashboardData.recentResults}
                    onViewChange={onViewChange}
                />
                <RecommendedResources
                    resources={dashboardData.recommendedResources}
                    onViewChange={onViewChange}
                />
            </div>
        </>
    )
}

export function UserDashboardUI({
    tests,
    initialData,
    objectives,
    userInterestTagIds,
    allTags,
    initialResources,
    questions,
    dashboardData,
    initialOnboardingState
}: UserDashboardUIProps & { tests: UserTest[] } & {questions: number} & { dashboardData: DashboardData }) {
    const [view, setView] = useState<View>("Dashboard")
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleViewChange = (next: View) => {
        setView(next)
        setMobileOpen(false)
    }

    const viewProgress = () => {
        setView("Results")
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
            <div className="flex min-w-0 flex-1 flex-col will-change-[width]">
                <Topbar data={{name: initialData.name, email: initialData.email}} onMenuOpen={() => setMobileOpen(true)} />
                <main className="flex-1 space-y-6 p-4 md:p-6">
                    {view === "Dashboard" &&
                        <DashboardView
                            initialData={initialData}
                            tests={tests}
                            objectives={objectives}
                            questions={questions}
                            dashboardData={dashboardData}
                            onStart={[viewProgress ,startTest]}
                            onViewChange={handleViewChange}
                    />}
                    {view === "Tests" && (
                        <TestsView
                            tests={tests}
                            id={initialData.id}
                            initialOnboardingState={initialOnboardingState}
                        />
                    )}
                    {view === "Results" && <ResultsView/>}
                    {view === "Resources" && <ResourcesView resources={initialResources} />}
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


