"use client";

import { Question } from "@/lib/types";
import { useState } from "react";

export default function QuestionForm({
                                         question,
                                         onClose,
                                         onCancel
                                     }: {
    question: Question;
    onClose: () => void;
    onCancel: () => void;
}) {
    // Simulating state for the mock form instead of importing heavy libraries right away
    const [title, setTitle] = useState(question.title);
    const [text, setText] = useState(question.text);
    const [categoryId, setCategoryId] = useState(question.categoryId);
    const [difficulty, setDifficulty] = useState(question.difficulty);
    const [isActive, setIsActive] = useState(question.isActive);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        // Simulate saving to mock data
        const updatedData = {
            ...question,
            title,
            text,
            categoryId,
            difficulty,
            isActive,
        };

        console.log("Mock Save Triggered:", updatedData);
        alert("Data saved to console (Mock Mode)");

        // Close panel after save
        onClose();
    };

    return (
        <form onSubmit={handleSave} className="flex flex-col gap-5">
            {/* Title Field */}
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                />
            </div>

            {/* Text Field */}
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Prompt</label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                />
            </div>

            {/* Metadata Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Category</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="Frontend">Frontend</option>
                        <option value="Backend">Backend</option>
                        <option value="Database">Database</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Difficulty</label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
                <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                />
                <label htmlFor="isActive" className="text-sm font-medium leading-none">
                    Active (Visible to Students)
                </label>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-border pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    Save Changes
                </button>
            </div>
        </form>
    );
}