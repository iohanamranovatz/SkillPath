'use client'

import {useMemo, useState} from "react"
import { BrainCircuit, Code2, LineChart, ChevronRight } from "lucide-react"
import { PageHeading } from "./page-heading"
import { Card } from "@/frontend/user/common/card"
import { Resource } from "@/frontend/user/lib/types"
import { SearchBar } from "@/frontend/admin/Questions/search-bar"
import Pagination from "@/frontend/components/pagination";

// pagination -> number of items per page
const ITEMS_PER_PAGE = 4;

const getResourceIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("course") || lowerType.includes("programming")) return BrainCircuit;
    if (lowerType.includes("video") || lowerType.includes("e-book")) return LineChart;
    return Code2; // Default fallback icon
};

export function ResourcesView({ resources = [] }: { resources?: Resource[] }) {
    const [searchQuery, setSearchQuery] = useState("")

    // pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Updates the search term and resets the page
    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1); // Reset to page 1 on every new search
    };

    // Filter the resources by category and title
    // based on what the user types in the search bar
    const filteredResources = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return resources.filter((resource) => {
            const categoryMatch = resource.category?.toLowerCase().includes(query) ?? false;
            const titleMatch = resource.title?.toLowerCase().includes(query) ?? false;
            return categoryMatch || titleMatch;
        });
    }, [resources, searchQuery]);


    const totalPages = Math.ceil(filteredResources.length / ITEMS_PER_PAGE) || 1;

    const paginatedCategories = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredResources.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredResources, currentPage]);



    return (
        <div className="space-y-6">
            <PageHeading
                title="Resources"
                description="Curated material to help you level up your development skills."
            />

            <div className="max-w-md">
                <SearchBar
                    value={searchQuery}
                    onChange={(e: any) => {
                        const val = typeof e === 'string' ? e : e?.target?.value ?? '';
                        handleSearch(val);
                    }}
                    placeholder="Search by category (e.g., Frontend, Database)..."
                />
            </div>

            {filteredResources.length === 0 ? (
                <div className="text-sm text-muted-foreground">No resources available found.</div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {paginatedCategories.map((resource) => {
                        const Icon = getResourceIcon(resource.type);

                        return (
                            <Card key={resource.id} className="flex gap-5 p-6">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary">
                                    <Icon className="size-[23px]" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs uppercase tracking-widest text-muted-foreground">
                                            {resource.type}
                                        </span>
                                        {resource.category && (
                                            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                {resource.category}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-lg font-semibold">{resource.title}</h2>
                                    <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                    >
                                        Open resource <ChevronRight className="size-4" />
                                    </a>
                                </div>
                            </Card>
                        )

                    })}
                </div>
            )}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredResources.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </div>
    )
}