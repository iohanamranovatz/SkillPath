"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitInitialAssessmentAction } from "@/backend/user/assessments/initial/initialAssessmentActions";
import { saveSingleAnswer } from "@/backend/user/saveProgressAssessment";
import { Card } from "@/frontend/user/common/card";
import { Button } from "@/frontend/user/common/button";

type Question = {
    id: number;
    question_text: string;
    difficulty: string;
    options: { id: string; text: string }[];
    selectedOptionId: string | null;
};

export function InitialAssessmentRunner({
    assessmentId,
    questions,
}: {
    assessmentId: number;
    questions: Question[];
}) {
    const router = useRouter();

    const [answers, setAnswers] = useState<Record<number, string>>(() => {
        const init: Record<number, string> = {};
        questions.forEach((q) => {
            if (q.selectedOptionId) init[q.id] = q.selectedOptionId;
        });
        return init;
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any | null>(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const saveTimers = useRef<Record<number, NodeJS.Timeout>>({});
    const pendingSaves = useRef<Set<number>>(new Set());

    const pick = (questionId: number, optionId: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
        pendingSaves.current.add(questionId);
        setIsAutoSaving(true);

        if (saveTimers.current[questionId]) {
            clearTimeout(saveTimers.current[questionId]);
        }

        saveTimers.current[questionId] = setTimeout(async () => {
            const saveResult = await saveSingleAnswer(assessmentId, questionId, optionId);
            if (!saveResult.success) {
                setError(saveResult.message ?? "Unable to save your answer.");
            }

            pendingSaves.current.delete(questionId);
            if (pendingSaves.current.size === 0) {
                setIsAutoSaving(false);
            }
        }, 1500);
    };

    const allAnswered = questions.every((q) => answers[q.id]);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const payload = questions.map((q) => ({ questionId: q.id, optionId: answers[q.id] }));
            const res = await submitInitialAssessmentAction(assessmentId, payload);

            if (!res.success || !res.data) {
                setError(res.message ?? "Unable to submit initial assessment.");
                return;
            }

            setResult(res.data);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (submitError) {
            const message =
                submitError instanceof Error ? submitError.message : "Unable to submit initial assessment.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (result) {
        return (
            <Card className="space-y-6 p-6">
                <div className="space-y-1 text-center">
                    <h1 className="text-xl font-semibold">Initial assessment completed!</h1>
                    <p className="text-4xl font-bold text-chart-3">{result.scorePct}%</p>
                    <p className="text-sm text-muted-foreground">
                        {result.correct} out of {result.total} correct
                    </p>
                    {result.level && (
                        <p className="text-sm">
                            Estimated level: <span className="font-medium">{result.level}</span>
                        </p>
                    )}
                </div>

                <Button onClick={() => router.push("/userDashboard")} className="w-full">
                    Back to dashboard
                </Button>
            </Card>
        );
    }

    return (
        <div className="relative rounded-xl border bg-muted/30 p-6 md:p-8 space-y-6">
            <div className="absolute top-6 right-6 flex h-6 items-center">
                {isAutoSaving && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                        <svg className="h-4 w-4 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                    </div>
                )}
            </div>

            <div>
                <h1 className="text-xl font-semibold">Initial assessment</h1>
                <p className="text-sm text-muted-foreground">
                    {questions.length} questions - answer all of them to estimate your level.
                </p>
            </div>

            {questions.map((q, idx) => (
                <Card key={q.id} className="space-y-3 p-6 bg-background">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="font-medium">
                            {idx + 1}. {q.question_text}
                        </h2>
                        <span className="text-xs text-muted-foreground">{q.difficulty}</span>
                    </div>
                    <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                            const selected = answers[q.id] === opt.id;
                            const letter = String.fromCharCode(65 + optIdx);

                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => pick(q.id, opt.id)}
                                    className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                                        selected
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:bg-muted"
                                    }`}
                                >
                                    <span className="font-semibold mr-2">{letter}.</span>
                                    {opt.text}
                                </button>
                            );
                        })}
                    </div>
                </Card>
            ))}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleSubmit} disabled={loading || !allAnswered} className="w-full">
                {loading
                    ? "Submitting..."
                    : allAnswered
                        ? "Submit initial assessment"
                        : "All questions must be answered"}
            </Button>
        </div>
    );
}
