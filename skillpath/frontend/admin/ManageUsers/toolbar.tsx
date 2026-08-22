"use client";

import { SearchBar} from "@/frontend/admin/Questions/search-bar";
import { FilterSelect} from "@/frontend/admin/Questions/filter";

interface Props {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    level: string;
    onLevelChange: (value: string) => void;
}

export default function UserToolbar({
                                        searchTerm,
                                        onSearchChange,
                                        level,
                                        onLevelChange
                                    }: Props) {

    const levelOptions = [
        { label: "All Levels", value: "all" },
        { label: "Junior", value: "Junior" },
        { label: "Mid", value: "Mid" },
        { label: "Senior", value: "Senior" },
    ];

    return (
        <div className="flex items-center gap-4">
            <SearchBar
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="Search users..."
                className="max-w-sm"
            />

            <FilterSelect
                value={level}
                onChange={onLevelChange}
                options={levelOptions}
                className="w-[180px]"
            />
        </div>
    );
}