"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, X, Check, AlertTriangle, RotateCcw } from "lucide-react";
import {
    generateQuestionDrafts,
    saveQuestionDrafts,
} from "@/backend/admin/actions/generateQuestions";
import type { Difficulty, QuestionDraft } from "@/backend/admin/actions/generateQuestions";
import { getAllCategories } from "@/backend/admin/actions/questions";

type ReviewItem = QuestionDraft & { keep: boolean };

export default function AiGenerator() {
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [category, setCategory] = useState("");
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    const [count, setCount] = useState(5);

    const [items, setItems] = useState<ReviewItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (!isOpen || categories.length > 0) return;

        getAllCategories()
            .then((list) => {
                setCategories(list);
                if (list.length > 0) setCategory((current) => current || list[0]);
            })
            .catch(() => setCategories([]));
    }, [isOpen, categories.length]);

    const keptCount = items.filter((item) => item.keep).length;

    const handleGenerate = async () => {
        if (!category) return;

        setIsGenerating(true);
        setMessage(null);
        setItems([]);

        try {
            const res = await generateQuestionDrafts({ category, difficulty, count });

            if (res.success && res.drafts) {
                // Likely duplicates start unchecked, so keeping one is a deliberate act.
                setItems(res.drafts.map((draft) => ({ ...draft, keep: !draft.duplicateOf })));

                if (res.discarded) {
                    setMessage({
                        type: "ok",
                        text: `${res.discarded} malformed question(s) were dropped before review.`,
                    });
                }
            } else {
                setMessage({ type: "error", text: res.error ?? "Generation failed." });
            }
        } catch {
            setMessage({ type: "error", text: "Generation failed." });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        const kept = items.filter((item) => item.keep);
        if (kept.length === 0) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const res = await saveQuestionDrafts({
                category,
                difficulty,
                drafts: kept.map(({ text, options, correctIndex }) => ({ text, options, correctIndex })),
            });

            if (res.success) {
                setItems([]);
                setMessage({
                    type: "ok",
                    text: `${res.inserted} question(s) saved as inactive drafts. Activate them from the table when ready.`,
                });
                router.refresh();
            } else {
                setMessage({ type: "error", text: res.error ?? "Saving failed." });
            }
        } catch {
            setMessage({ type: "error", text: "Saving failed." });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleKeep = (index: number) => {
        setItems((current) =>
            current.map((item, i) => (i === index ? { ...item, keep: !item.keep } : item))
        );
    };

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex h-10 w-auto shrink-0 self-end items-center justify-center rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20 cursor-pointer"
            >
                <Sparkles className="mr-1.5 h-4 w-4" />
                Generate with AI
            </button>
        );
    }

    return (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    <span>Generate questions with AI</span>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(false);
                        setItems([]);
                        setMessage(null);
                    }}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground sm:flex-1">
                    Category
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={isGenerating || isSaving || categories.length === 0}
                        className="h-10 rounded-lg border border-white/10 bg-card px-3 text-sm text-foreground disabled:opacity-50"
                    >
                        {categories.length === 0 && <option value="">Loading...</option>}
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground sm:w-[150px]">
                    Difficulty
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                        disabled={isGenerating || isSaving}
                        className="h-10 rounded-lg border border-white/10 bg-card px-3 text-sm text-foreground disabled:opacity-50"
                    >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                    </select>
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground sm:w-[110px]">
                    How many
                    <input
                        type="number"
                        min={1}
                        max={10}
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        disabled={isGenerating || isSaving}
                        className="h-10 rounded-lg border border-white/10 bg-card px-3 text-sm text-foreground disabled:opacity-50"
                    />
                </label>

                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || isSaving || !category}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : items.length > 0 ? (
                        <>
                            <RotateCcw className="mr-1.5 h-4 w-4" />
                            Regenerate
                        </>
                    ) : (
                        "Generate"
                    )}
                </button>
            </div>

            {message && (
                <p className={`text-xs ${message.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                    {message.text}
                </p>
            )}

            {/* Review list - nothing is written to the database until Save */}
            {items.length > 0 && (
                <div className="space-y-3 border-t border-white/10 pt-4">
                    <p className="text-xs text-muted-foreground">
                        Review before saving. Nothing has been written to the database yet.
                    </p>

                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={`rounded-xl border p-4 transition-colors ${
                                item.keep
                                    ? "border-emerald-500/30 bg-emerald-500/5"
                                    : "border-white/10 bg-white/[0.02] opacity-60"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1 space-y-3">
                                    <p className="text-sm font-medium text-foreground">{item.text}</p>

                                    <ul className="grid gap-1.5 sm:grid-cols-2">
                                        {item.options.map((option, optionIndex) => {
                                            const isCorrect = optionIndex === item.correctIndex;
                                            return (
                                                <li
                                                    key={optionIndex}
                                                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                                                        isCorrect
                                                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                                            : "border-white/10 text-muted-foreground"
                                                    }`}
                                                >
                                                    {isCorrect && <Check className="h-3.5 w-3.5 shrink-0" />}
                                                    <span>{option}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {item.duplicateOf && (
                                        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
                                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                            <span>
                                                Looks like an existing question (
                                                {Math.round(item.similarity * 100)}% overlap):{" "}
                                                <span className="italic">&ldquo;{item.duplicateOf}&rdquo;</span>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => toggleKeep(index)}
                                    className={`inline-flex h-8 shrink-0 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors cursor-pointer ${
                                        item.keep
                                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                                            : "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10"
                                    }`}
                                >
                                    {item.keep ? "Keep" : "Discard"}
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-xs text-muted-foreground">
                            {keptCount} of {items.length} selected
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setItems([]);
                                    setMessage(null);
                                }}
                                disabled={isSaving}
                                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 disabled:opacity-50 cursor-pointer"
                            >
                                Discard all
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving || keptCount === 0}
                                className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    `Save ${keptCount} question${keptCount === 1 ? "" : "s"}`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
