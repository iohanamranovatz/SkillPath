"use client";

import { SearchBar } from "./search-bar";
import { FilterSelect } from "./filter";
import { Plus } from "lucide-react";

interface Props {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    difficulty: string;
    onDifficultyChange: (value: string) => void;
}

export default function QuestionToolbar({
                                            searchTerm,
                                            onSearchChange,
                                            difficulty,
                                            onDifficultyChange
                                        }: Props) {

    const difficultyOptions = [
        { label: "All Difficulties", value: "all" },
        { label: "Easy", value: "EASY" },
        { label: "Medium", value: "MEDIUM" },
        { label: "Hard", value: "HARD" },
    ];

    const handleAddClick = () => {
        const params = new URLSearchParams(window.location.search);
        params.set("id", "new"); // Triggers the panel to open in creation mode
        window.history.pushState(null, "", `?${params.toString()}`);
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
            {/* Search Bar takes up remaining space */}
            <SearchBar
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="Search questions..."
                className="w-full sm:max-w-sm"
            />

            {/* Right Side: Difficulty Bar + Add Button side-by-side */}
            <div className="flex items-center gap-3">
                <FilterSelect
                    value={difficulty}
                    onChange={onDifficultyChange}
                    options={difficultyOptions}
                    className="w-[150px]" // Reduced width to make it smaller
                />

                <button
                    type="button"
                    onClick={handleAddClick}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 shadow-sm cursor-pointer"
                >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Question
                </button>
            </div>
        </div>
    );
}