"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { PageHeading } from "./page-heading"
import { Card } from "@/frontend/user/common/card"
import { Button } from "@/frontend/user/common/button"
import { startInitialAssessment } from "@/backend/user/assessments/initial/initialAssessmentActions";
import type { InitialAssessmentOnboardingState } from "@/frontend/user/lib/types";

export type UserTest = {
    id: number
    categories: string[]
    questions: number
    score: number | null
    status: string
    startedAt: string | null
    completedAt: string | null
    progress?: string | null, // "20%"
    isInitial?: boolean
}

// pagination -> number of items per page
const ITEMS_PER_PAGE = 4;

export function TestsView({
                              tests,
                              id,
                              initialOnboardingState,
                          }: {
    tests: UserTest[],
    id: number,
    initialOnboardingState: InitialAssessmentOnboardingState
} ) {
    const [activeFilter, setActiveFilter] = useState<string>("All tests")
    const router = useRouter();
    const [isStartingInitialTest, setIsStartingInitialTest] = useState(false);
    const [initialTestError, setInitialTestError] = useState<string | null>(null);
    const needsInitialAssessment = initialOnboardingState.requiresInitialAssessment;

    // pagination
    const [currentPage, setCurrentPage] = useState(1);

    async function handleInitialTest() {
        setIsStartingInitialTest(true);
        setInitialTestError(null);

        try {
            if (initialOnboardingState.activeInitialAssessmentId) {
                router.push(`/assessment/${initialOnboardingState.activeInitialAssessmentId}`);
                return;
            }

            const test = await startInitialAssessment(id);
            if (test.success && test.data?.assessmentId) {
                router.push(`/assessment/${test.data.assessmentId}`);
                return;
            }

            setInitialTestError(test.message ?? "Unable to start the initial assessment.");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to start the initial assessment.";
            setInitialTestError(message);
        } finally {
            setIsStartingInitialTest(false);
        }
    }

    if (needsInitialAssessment) {
        return (
            <div className="space-y-6">
                <PageHeading
                    title="Tests"
                    description="Sharpen your skills with focused coding and algorithm challenges."
                />
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 rounded-lg border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">
                        Complete your one-time initial test to unlock your personalized learning path and establish your developer profile.
                    </p>
                    {initialTestError && (
                        <p className="text-sm text-destructive">{initialTestError}</p>
                    )}
                    <Button
                        type="button"
                        onClick={handleInitialTest}
                        disabled={isStartingInitialTest}
                    >
                        <Sparkles className="size-4 mr-2" />
                        {isStartingInitialTest
                            ? "Starting..."
                            : initialOnboardingState.activeInitialAssessmentId
                                ? "Resume your initial test"
                                : "Take your first test"}
                    </Button>
                </div>
            </div>
        )
    }
    const regularTests = tests.filter((test) => !test.isInitial);
    const categories = Array.from(new Set(regularTests.flatMap((t) => t.categories)))
    const filters = ["All tests", ...categories, "Completed"]

    const visibleTests = tests.filter((test) => {
        if(activeFilter == "All tests") return true
        if(activeFilter == "Completed") return test.score != null
        return test.categories.includes(activeFilter)
    })

    // Reset the page when the user changes the filter
    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter)
        setCurrentPage(1)
    }

    // Pagination computations
    const totalPages = Math.ceil(visibleTests.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginatedTests = visibleTests.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1))
    }

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
    }

    return (
        <div className="space-y-6">
            <PageHeading
                title="Tests"
                description="Sharpen your skills with focused coding and algorithm challenges."
                action={
                    <Button onClick={() => router.push("/assessment/new")}>
                        <Sparkles className="size-4 mr-2" />
                        Start a test
                    </Button>
                }
            />

            <div className="flex gap-2 overflow-x-auto">
                {filters.map((filter) => {
                    const isActive = activeFilter === filter
                    return (
                        <Button
                            key={filter}
                            size="sm"
                            variant={isActive ? "default" : "ghost"}
                            className={isActive ? undefined : "text-muted-foreground"}
                            onClick={() => handleFilterChange(filter)}
                        >
                            {filter}
                        </Button>
                    )
                })}
            </div>

            {visibleTests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tests in this category yet.</p>
            ) : (
                <div className="space-y-4">
                    {/* Lista paginata */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        {paginatedTests.map((test) => (
                            <Card
                                key={test.id}
                                className={`flex flex-col justify-between p-6 ${
                                    test.isInitial
                                        ? "border-primary/50 bg-primary/5 shadow-md"
                                        : ""
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-3">
                                        <h2 className="text-lg font-semibold">
                                            {test.isInitial
                                                ? "Test Initial"
                                                : (test.categories.join(", ") || `Test #${test.id}`)}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {test.questions} questions
                                        </p>
                                    </div>
                                    {test.score !== null && (
                                        <span className="text-xl font-semibold text-chart-3">{test.score}%</span>
                                    )}
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        {test.score === null ? "Not started yet" : "Completed"}
                                    </span>
                                    <Button
                                        variant={test.isInitial ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => router.push(
                                            test.score === null
                                                ? `/assessment/${test.id}`
                                                : `/assessment/${test.id}/completed`
                                        )}
                                    >
                                        {test.score === null ? "Take test" : "Review"}
                                        <ChevronRight className="size-4 ml-2" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t text-sm">
                            <span className="text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}