"use client";

import { Question } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { X, CheckCircle2, Edit } from "lucide-react";
import QuestionForm from "./form";

export default function QuestionPanel({ questions }: { questions: Question[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeId = searchParams.get("id");

    const [isEditing, setIsEditing] = useState(false);
    const [prevActiveId, setPrevActiveId] = useState(activeId);

    if (activeId !== prevActiveId) {
        setPrevActiveId(activeId);
        setIsEditing(false);
    }

    const activeQuestion = questions.find((q) => q.id === activeId);

    const closePanel = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("id");
        router.push(`${pathname}?${params.toString()}`);
    };

    if (!activeQuestion) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-all"
                onClick={closePanel}
            />

            {/* Side Panel */}
            <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-white/10 bg-card shadow-2xl transition-transform duration-300 ease-in-out flex flex-col">
                {/* Panel Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
                    <h2 className="text-lg font-semibold text-card-foreground tracking-tight">
                        {isEditing ? "Edit Question" : "Question Details"}
                    </h2>
                    <button
                        onClick={closePanel}
                        className="rounded-full p-2 hover:bg-white/10 text-muted-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Panel Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isEditing ? (
                        <QuestionForm
                            question={activeQuestion}
                            onClose={closePanel}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <div className="flex flex-col gap-6">
                            {/* Metadata */}
                            <div className="flex items-center gap-3 text-sm flex-wrap">
                                <span className="rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-muted-foreground font-mono text-xs">
                                    {activeQuestion.id}
                                </span>
                                <span className="table-badge badge-category">
                                    {activeQuestion.categoryId}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {activeQuestion.difficulty}
                                </span>
                            </div>

                            {/* Text Prompt */}
                            <div>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prompt</h3>
                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-card-foreground text-sm leading-relaxed">
                                    {activeQuestion.text}
                                </div>
                            </div>

                            {/* Options */}
                            <div>
                                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Options</h3>
                                <div className="flex flex-col gap-3">
                                    {activeQuestion.options.map((opt) => {
                                        const isCorrect = opt.id === activeQuestion.correctAnswerId;
                                        return (
                                            <div
                                                key={opt.id}
                                                className={`flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                                                    isCorrect
                                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                                        : "border-white/10 bg-card text-foreground/80 hover:bg-white/[0.02]"
                                                }`}
                                            >
                                                <span className="text-sm font-medium">{opt.text}</span>
                                                {isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Panel Footer (Read-Only Mode) */}
                {!isEditing && (
                    <div className="border-t border-white/10 p-4 bg-white/[0.02] flex justify-end gap-3">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors shadow-sm"
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Question
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}