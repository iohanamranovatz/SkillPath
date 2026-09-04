"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitAssessment } from "@/backend/user/submitAssessment";
import { saveSingleAnswer} from "@/backend/user/saveProgressAssessment";
import { Card } from "@/frontend/user/common/card";
import { Button } from "@/frontend/user/common/button";
import { AnswerReview, ReviewedQuestion } from "@/frontend/user/components/answer-review";

type Question = {
    id: number;
    question_text: string;
    difficulty: string;
    options: { id: string; text: string }[];
    selectedOptionId: string | null;
};

export function AssessmentRunner({
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

    // --- AUTO-SAVE STATE & REFS ---
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const saveTimers = useRef<Record<number, NodeJS.Timeout>>({});
    const pendingSaves = useRef<Set<number>>(new Set());

    const pick = (questionId: number, optionId: string) => {
        // 1. Update UI instantly
        setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

        // 2. Mark this question as pending a save and show loader
        pendingSaves.current.add(questionId);
        setIsAutoSaving(true);

        // 3. Clear existing timer for THIS question if they change their mind quickly
        if (saveTimers.current[questionId]) {
            clearTimeout(saveTimers.current[questionId]);
        }

        // 4. Start a new 1-second debounce timer for this question
        saveTimers.current[questionId] = setTimeout(async () => {
            await saveSingleAnswer(assessmentId, questionId, optionId);

            // Remove this question from pending saves
            pendingSaves.current.delete(questionId);

            // If no more saves are pending, hide the loader
            if (pendingSaves.current.size === 0) {
                setIsAutoSaving(false);
            }
        }, 1500); // 1500ms delay
    };

    const allAnswered = questions.every((q) => answers[q.id]);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        // Note: submitAssessment calculates the score, so we pass the answers state.
        const payload = questions.map((q) => ({ questionId: q.id, optionId: answers[q.id] }));
        const res = await submitAssessment(assessmentId, payload);

        setLoading(false);
        if (!res.success || !res.data) {
            setError(res.message ?? "Error at submitting.");
            return;
        }
        setResult(res.data);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (result) {
        // imperechem intrebarile din test cu corectura primita de la server
        const reviewById = new Map<number, any>(
            (result.review ?? []).map((r: any) => [r.questionId, r])
        );

        const reviewedQuestions: ReviewedQuestion[] = questions.map((q) => {
            const r = reviewById.get(q.id);
            return {
                id: q.id,
                question_text: q.question_text,
                difficulty: q.difficulty,
                options: q.options,
                selectedOptionId: r?.selectedOptionId ?? answers[q.id] ?? null,
                isCorrect: r?.isCorrect ?? null,
                correctAnswer: r?.correctOptionId ?? null,
            };
        });

        return (
            <div className="space-y-6">
                <Card className="space-y-6 p-6">
                    <div className="space-y-1 text-center">
                        <h1 className="text-xl font-semibold">Test completed!</h1>
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

                    <div className="space-y-3">
                        <h2 className="text-sm font-medium">Score by category</h2>
                        {result.perCategory?.map((c: any) => (
                            <div key={c.category} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span>{c.category}</span>
                                    <span
                                        className={
                                            c.score < 50 ? "text-destructive" : "text-muted-foreground"
                                        }
                                    >
                                        {c.score}%{c.score < 50 ? " · weak area" : ""}
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted">
                                    <div
                                        className="h-2 rounded-full bg-primary"
                                        style={{ width: `${c.score}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="space-y-3">
                    <h2 className="text-sm font-medium">Your answers</h2>
                    <AnswerReview questions={reviewedQuestions} />
                </div>

                <Button onClick={() => router.push("/userDashboard")} className="w-full">
                    Back to dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="relative rounded-xl border bg-muted/30 p-6 md:p-8 space-y-6">

            {/* Auto-Save Loading Icon in top right */}
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
                <h1 className="text-xl font-semibold">Test</h1>
                <p className="text-sm text-muted-foreground">
                    {questions.length} questions · answer them all.
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
                            const letter = String.fromCharCode(65 + optIdx); // 0 -> A, 1 -> B, 2 -> C...

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
                        ? "Submit test"
                        : "All questions must be answered"}
            </Button>
        </div>
    );
}