"use client";

import { SearchBar } from "./search-bar";
import { FilterSelect } from "./filter";

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

    return (
        <div className="flex items-center gap-4">
            <SearchBar
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="Search questions..."
                className="max-w-sm"
            />

            <FilterSelect
                value={difficulty}
                onChange={onDifficultyChange}
                options={difficultyOptions}
                className="w-[180px]"
            />
        </div>
    );
}