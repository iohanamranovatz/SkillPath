"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitAssessment } from "@/backend/user/submitAssessment";
import { Card } from "@/frontend/user/common/card";
import { Button } from "@/frontend/user/common/button";

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

    // raspunsurile alese: { [questionId]: optionId }
    const [answers, setAnswers] = useState<Record<number, string>>(() => {
        const init: Record<number, string> = {};
        questions.forEach((q) => {
            if (q.selectedOptionId) init[q.id] = q.selectedOptionId;
        });
        return init;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{
        correct: number;
        total: number;
        scorePct: number;
        perCategory: { category: string; score: number; correct: number; total: number }[];
        level: string | null;
    } | null>(null);

    const pick = (questionId: number, optionId: string) =>
        setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

    const allAnswered = questions.every((q) => answers[q.id]);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        const payload = questions.map((q) => ({ questionId: q.id, optionId: answers[q.id] }));
        const res = await submitAssessment(assessmentId, payload);
        setLoading(false);
        if (!res.success || !res.data) {
            setError(res.message ?? "Eroare la trimiterea testului.");
            return;
        }
        setResult(res.data);
    };

    // ecranul de rezultat (dupa submit)
    if (result) {
        return (
            <Card className="space-y-6 p-6">
                <div className="space-y-1 text-center">
                    <h1 className="text-xl font-semibold">Test finalizat!</h1>
                    <p className="text-4xl font-bold text-chart-3">{result.scorePct}%</p>
                    <p className="text-sm text-muted-foreground">
                        {result.correct} din {result.total} corecte
                    </p>
                    {result.level && (
                        <p className="text-sm">
                            Nivel estimat: <span className="font-medium">{result.level}</span>
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <h2 className="text-sm font-medium">Scor pe categorie</h2>
                    {result.perCategory.map((c) => (
                        <div key={c.category} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>{c.category}</span>
                                <span
                                    className={
                                        c.score < 50 ? "text-destructive" : "text-muted-foreground"
                                    }
                                >
                                    {c.score}%{c.score < 50 ? " · zona slaba" : ""}
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

                <Button onClick={() => router.push("/userDashboard")}>Inapoi la dashboard</Button>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Test</h1>
                <p className="text-sm text-muted-foreground">
                    {questions.length} intrebari · raspunde la toate.
                </p>
            </div>

            {questions.map((q, idx) => (
                <Card key={q.id} className="space-y-3 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="font-medium">
                            {idx + 1}. {q.question_text}
                        </h2>
                        <span className="text-xs text-muted-foreground">{q.difficulty}</span>
                    </div>
                    <div className="space-y-2">
                        {q.options.map((opt) => {
                            const selected = answers[q.id] === opt.id;
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
                                    {opt.text}
                                </button>
                            );
                        })}
                    </div>
                </Card>
            ))}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleSubmit} disabled={loading || !allAnswered}>
                {loading
                    ? "Se trimite..."
                    : allAnswered
                    ? "Trimite testul"
                    : "Raspunde la toate intrebarile"}
            </Button>
        </div>
    );
}
