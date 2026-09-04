"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/frontend/user/common/button";
import { CalendarDays } from "lucide-react";
import { AnswerReview, ReviewedQuestion } from "@/frontend/user/components/answer-review";

type Question = ReviewedQuestion;

type AssessmentDetails = {
    category: string;
    dateStarted: string;
};

export function AssessmentViewer({   score,
                                     questions,
                                     details,
                                 }: {
    assessmentId: number;
    score: number;
    questions: Question[];
    details: AssessmentDetails;
}) {
    const router = useRouter();

    return (
        <div className="relative rounded-xl border bg-muted/10 p-6 md:p-8 space-y-8">

            {/* Header: Title, Info, and Score */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                    <h1 className="text-xl font-semibold">Assessment Results</h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <span>{details.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CalendarDays className="size-4 opacity-70" />
                            <span>Started: {details.dateStarted}</span>
                        </div>
                    </div>
                </div>

                {score !== undefined && score !== null && (
                    <div className="flex flex-col items-center justify-center rounded-lg border bg-background px-6 py-3 shadow-sm shrink-0">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Final Score
                        </span>
                        <span className="text-2xl font-bold text-primary">
                            {score}%
                        </span>
                    </div>
                )}
            </div>

            {/* Questions List */}
            <AnswerReview questions={questions} />

            <Button onClick={() => router.push("/userDashboard")} variant="outline" className="w-full">
                Back to Dashboard
            </Button>
        </div>
    );
}