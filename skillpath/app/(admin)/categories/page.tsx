'use client';

import { useState, useMemo } from 'react';
import { MOCK_CATEGORIES} from "@/frontend/admin/lib/mock-data";
import { CategoryCard} from "@/frontend/admin/Categories/card";
import { SearchBar} from "@/frontend/admin/Questions/search-bar";
import AdminSidebar from "@/frontend/admin/components/Sidebar";
import AdminHeader from "@/frontend/admin/components/Header";
import AdminFooter from "@/frontend/admin/components/Footer";

export default function CategoriesPage() {
    const [searchTerm, setSearchTerm] = useState('');

    // Local filtering using useMemo for zero-latency feedback
    const filteredCategories = useMemo(() => {
        return MOCK_CATEGORIES.filter((cat) => {
            const matchesName = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTags = cat.tags.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesName || matchesTags;
        });
    }, [searchTerm]);

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />

            <div className="flex flex-1 flex-col">
                <AdminHeader />

                <main className="flex-1 bg-background p-8 text-foreground">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Page Header */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Skill Categories</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Browse software skill tracks and associated exercise metrics.
                                </p>
                            </div>
                            <button className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30">
                                + Add Category
                            </button>
                        </div>

                        {/* Toolbar (Search) */}
                        <div className="flex items-center justify-between">
                            <SearchBar
                                value={searchTerm}
                                onChange={(val) => setSearchTerm(val)}
                                placeholder="Search categories or tags..."
                                className="w-full sm:w-80 search-input-modern"
                            />
                        </div>

                        {/* Responsive Grid Layout - Exactly 2 cards per row */}
                        {filteredCategories.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredCategories.map((category) => (
                                    <CategoryCard
                                        key={category.id}
                                        category={category}
                                        onClick={() => console.log("Clicked card:", category.name)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-card rounded-2xl border border-white/10 shadow-sm">
                                <p className="text-muted-foreground text-sm">No categories found matching your search.</p>
                            </div>
                        )}
                    </div>
                </main>

                <AdminFooter />
            </div>
        </div>
    );
}