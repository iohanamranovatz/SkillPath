"use client";

import { Question } from "@/frontend/admin/lib/types";
import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateQuestion, createQuestion } from "@/backend/admin/actions/questions";
import { getAllCategories} from "@/backend/admin/actions/questions";

export default function QuestionForm({
                                         question,
                                         onClose,
                                         onCancel,
                                         isCreateMode = false
                                     }: {
    question: Question;
    onClose: () => void;
    onCancel: () => void;
    isCreateMode?: boolean;
}) {
    const [title, setTitle] = useState(question.title || "");
    const [text, setText] = useState(question.text || "");
    const [categoryId, setCategoryId] = useState(question.category || "");
    const [difficulty, setDifficulty] = useState(question.difficulty || "EASY");
    const [isActive, setIsActive] = useState(question.isActive || false);

    // Categories state fetched dynamically
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    const [options, setOptions] = useState(question.options);

    // Fetch categories on mount
    useEffect(() => {
        async function fetchCategories() {
            try {
                const categoriesList = await getAllCategories();
                setCategories(categoriesList); // Directly an array!
            } catch (err) {
                console.error("Failed to load categories:", err);
                setCategories([]);
            } finally {
                setIsLoadingCategories(false);
            }
        }
        fetchCategories();
    }, []);

    // O intrebare are exact UN raspuns corect. Intrebarile vechi pot avea mai multe
    // salvate ("a,b") -> pastram doar primul, ca adminul sa fie fortat sa aleaga unul.
    const initialCorrect = Array.isArray(question.correctAnswersId)
        ? (question.correctAnswersId[0] ?? "")
        : (question.correctAnswersId ?? "").split(",")[0].trim();
    const [correctAnswerId, setCorrectAnswerId] = useState<string>(initialCorrect);

    // Form submission states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleOptionTextChange = (id: string, newText: string) => {
        setOptions(options.map(opt => opt.id === id ? { ...opt, text: newText } : opt));
    };

    // selectie exclusiva -> alegerea unei optiuni o inlocuieste pe cea anterioara
    const selectCorrectAnswer = (id: string) => {
        setCorrectAnswerId(id);
        setErrorMsg("");
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!correctAnswerId) {
            setErrorMsg("You must select the correct answer.");
            return;
        }

        setIsSubmitting(true);
        setErrorMsg("");

        const payload = {
            title,
            text,
            category: categoryId,
            difficulty: difficulty.toUpperCase() as any,
            isActive,
            options,
            correctAnswersId: correctAnswerId,
        };

        let response;

        if (isCreateMode) {
            response = await createQuestion(payload);
        } else {
            response = await updateQuestion(question.id, payload);
        }

        if (response.success) {
            onClose();
        } else {
            setErrorMsg(response.error || `Failed to ${isCreateMode ? "create" : "update"} question.`);
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="flex flex-col gap-5">
            {/* Error Message Display */}
            {errorMsg && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                    {errorMsg}
                </div>
            )}

            {/* Title Field */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    required
                />
            </div>

            {/* Text Field */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Text</label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="flex min-h-[120px] w-full rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 leading-relaxed"
                    required
                />
            </div>

            {/* Metadata Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        disabled={isLoadingCategories}
                        className="flex h-10 w-full rounded-xl border border-white/10 bg-card px-3 py-2 text-sm text-foreground transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
                        required
                    >
                        <option value="" disabled>
                            {isLoadingCategories ? "Loading categories..." : "Select category"}
                        </option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Difficulty</label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="flex h-10 w-full rounded-xl border border-white/10 bg-card px-3 py-2 text-sm text-foreground transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                    </select>
                </div>
            </div>

            {/* Optiuni editabile + un singur raspuns corect (comportament de radio) */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Options & Correct Answer (click a circle to pick the single correct one)
                </label>
                <div className="flex flex-col gap-3" role="radiogroup" aria-label="Correct answer">
                    {options.map((opt) => {
                        const isCorrect = correctAnswerId === opt.id;
                        return (
                            <div
                                key={opt.id}
                                className={`flex items-center gap-3 rounded-xl border p-2.5 transition-all ${
                                    isCorrect
                                        ? "border-emerald-500/40 bg-emerald-500/10"
                                        : "border-white/10 bg-white/[0.02]"
                                }`}
                            >
                                <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                                    className="flex-1 bg-transparent border-none text-sm text-foreground focus:outline-none px-2"
                                    required
                                />
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={isCorrect}
                                    onClick={() => selectCorrectAnswer(opt.id)}
                                    title={isCorrect ? "Correct Answer (Selected)" : "Mark as correct"}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                        isCorrect
                                            ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-105"
                                            : "border-2 border-white/20 bg-transparent hover:border-emerald-500/60 hover:shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                                    }`}
                                >
                                    {isCorrect && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center gap-2.5 mt-2 p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-background text-blue-600 focus:ring-blue-500/30 focus:ring-offset-background"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-foreground cursor-pointer">
                    Active (Visible to Students)
                </label>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors shadow-sm disabled:opacity-50 min-w-[155px]"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {isCreateMode ? "Creating..." : "Saving..."}
                        </>
                    ) : (
                        isCreateMode ? "Create Question" : "Save Changes"
                    )}
                </button>
            </div>
        </form>
    );
}