"use client";

import { Card } from "@/frontend/user/common/card";
import { Check, X } from "lucide-react";

export type ReviewedQuestion = {
    id: number;
    question_text: string;
    difficulty: string;
    options: { id: string; text: string }[];
    selectedOptionId: string | null;
    isCorrect: boolean | null;
    correctAnswer: string | null;
};

// List of questions with the answer chosen by the user and the correct one.
// Used both on the results page and on the post-submit screen.
export function AnswerReview({ questions }: { questions: ReviewedQuestion[] }) {
    return (
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

                            let optionStyles = "border-border/50 text-muted-foreground bg-transparent";
                            let Icon = null;
                            let iconColor = "";
                            let note = "";

                            if (isSelected && isCorrectOption) {
                                optionStyles = "border-green-500/50 bg-green-500/10 text-foreground";
                                Icon = Check;
                                iconColor = "text-green-600 dark:text-green-500";
                                note = "Your answer · correct";
                            } else if (isSelected && !isCorrectOption) {
                                optionStyles = "border-destructive/40 bg-destructive/10 text-foreground";
                                Icon = X;
                                iconColor = "text-destructive";
                                note = "Your answer";
                            } else if (!isSelected && isCorrectOption) {
                                optionStyles = "border-green-500/70 bg-green-500/10 text-foreground font-medium";
                                Icon = Check;
                                iconColor = "text-green-600 dark:text-green-500";
                                note = "Correct answer";
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
                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        {note && (
                                            <span className="text-xs text-muted-foreground">{note}</span>
                                        )}
                                        {Icon && (
                                            <Icon className={`size-4 ${iconColor}`} strokeWidth={2.5} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            ))}
        </div>
    );
}
