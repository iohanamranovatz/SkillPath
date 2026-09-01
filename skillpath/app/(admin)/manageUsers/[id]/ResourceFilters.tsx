"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
    categories: { id: number; name: string }[];
    selectedCategory: string;
    currentPage: number;
    totalPages: number;
}

export default function ResourceFilters({
                                            categories,
                                            selectedCategory,
                                            currentPage,
                                            totalPages,
                                        }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const updateQueryParams = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, value);
        if (key === "category") {
            params.set("page", "1"); // resetăm la pagina 1 la schimbarea categoriei
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Select Categorie */}
            <select
                value={selectedCategory}
                onChange={(e) => updateQueryParams("category", e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-blue-500 cursor-pointer"
            >
                <option value="all" className="bg-card text-foreground">
                    All Categories
                </option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()} className="bg-card text-foreground">
                        {cat.name}
                    </option>
                ))}
            </select>

            {/* Paginare */}
            <div className="flex items-center gap-1.5 border border-white/10 bg-white/5 rounded-lg px-2 py-1 text-xs">
                <button
                    disabled={currentPage <= 1}
                    onClick={() => updateQueryParams("page", (currentPage - 1).toString())}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                    <ChevronLeft className="size-3.5" />
                </button>

                <span className="px-1 font-medium text-muted-foreground">
                    {currentPage} / {totalPages}
                </span>

                <button
                    disabled={currentPage >= totalPages}
                    onClick={() => updateQueryParams("page", (currentPage + 1).toString())}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                    <ChevronRight className="size-3.5" />
                </button>
            </div>
        </div>
    );
}