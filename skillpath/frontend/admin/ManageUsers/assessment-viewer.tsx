"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/frontend/user/common/card";
import { Button } from "@/frontend/user/common/button";
import { Check, X, CalendarDays, Folder } from "lucide-react";

type Question = {
    id: number;
    question_text: string;
    difficulty: string;
    options: { id: string; text: string }[];
    selectedOptionId: string | null;
    isCorrect: boolean | null;
    correctAnswer: string | null;
};

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
            <div className="space-y-6">
                {questions.map((q, idx) => (
                    <Card key={q.id} className="space-y-4 p-6 bg-background shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="font-medium leading-relaxed">
                                {idx + 1}. {q.question_text}
                            </h2>
                            <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                {q.difficulty}
                            </span>
                        </div>

                        <div className="space-y-2.5">
                            {q.options.map((opt, optIdx) => {
                                const isSelected = q.selectedOptionId === opt.id;
                                const isCorrectOption = q.correctAnswer === opt.id || q.correctAnswer === opt.text;

                                const letter = String.fromCharCode(65 + optIdx);

                                // Lighter Default Styling
                                let optionStyles = "border-border/50 text-muted-foreground bg-transparent";
                                let Icon = null;
                                let iconColor = "";

                                if (isSelected && isCorrectOption) {
                                    // CORRECT (Selected)
                                    optionStyles = "border-green-500/50 bg-green-500/10 text-foreground";
                                    Icon = Check;
                                    iconColor = "text-green-600 dark:text-green-500";
                                } else if (isSelected && !isCorrectOption) {
                                    // WRONG (Selected)
                                    optionStyles = "border-destructive/40 bg-destructive/10 text-foreground";
                                    Icon = X;
                                    iconColor = "text-destructive";
                                } else if (!isSelected && isCorrectOption) {
                                    // MISSED CORRECT - Increased visibility (solid border, brighter background)
                                    optionStyles = "border-green-500/70 bg-green-500/10 text-foreground font-medium";
                                    Icon = Check;
                                    iconColor = "text-green-600 dark:text-green-500";
                                }

                                return (
                                    <div
                                        key={opt.id}
                                        className={`flex items-center justify-between rounded-lg border p-3.5 text-sm transition-colors ${optionStyles}`}
                                    >
                                        <div className="flex items-center">
                                            <span className="mr-3 font-semibold opacity-60">{letter}.</span>
                                            <span>{opt.text}</span>
                                        </div>
                                        {Icon && (
                                            <Icon className={`size-4 shrink-0 ml-3 ${iconColor}`} strokeWidth={2.5} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}