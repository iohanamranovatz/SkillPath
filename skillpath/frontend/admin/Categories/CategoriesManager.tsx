"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Dumbbell, X } from "lucide-react";
import {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
} from "@/backend/categories";
import { SearchBar } from "@/frontend/admin/Questions/search-bar";
import Pagination from "@/frontend/components/pagination";

type CategoryRow = {
    id: number;
    name: string;
    description: string | null;
    difficulty: string;
    exerciseCount: number;
};

// paginare -> numarul de categorii per pagina
const ITEMS_PER_PAGE = 6;

export function CategoriesManager() {
    const router = useRouter();
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // modal create/edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<CategoryRow | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // confirmare ștergere
    const [toDelete, setToDelete] = useState<CategoryRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    // paginare
    const [currentPage, setCurrentPage] = useState(1);

    async function load() {
        setLoading(true);
        const res = await getCategories();
        if (res.success) setCategories(res.data as CategoryRow[]);
        setLoading(false);
    }
    useEffect(() => { load(); }, []);

    const filtered = useMemo(
        () => categories.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [categories, searchTerm]
    );

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;

    const paginatedCategories = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filtered.slice(start, start + ITEMS_PER_PAGE);
    }, [filtered, currentPage]);


    function openCreate() {
        setEditing(null);
        setName("");
        setDescription("");
        setDifficulty("beginner");
        setError("");
        setModalOpen(true);
    }

    function openEdit(cat: CategoryRow) {
        setEditing(cat);
        setName(cat.name);
        setDescription(cat.description ?? "");
        setDifficulty(cat.difficulty ?? "");
        setError("");
        setModalOpen(true);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError("");
        const res = editing
            ? await updateCategory({ id: editing.id, name, description, difficulty: difficulty })
            : await addCategory({ name, description, difficulty });
        setSaving(false);
        if (res.success) {
            setModalOpen(false);
            await load();
        } else {
            setError(res.message ?? "A apărut o eroare.");
        }
    }

    async function handleDelete() {
        if (!toDelete) return;
        setDeleting(true);
        const res = await deleteCategory(toDelete.id);
        setDeleting(false);
        if (res.success) {
            setToDelete(null);
            await load();
        } else {
            setError(res.message ?? "A apărut o eroare.");
            setToDelete(null);
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Skill Categories</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Browse software skill tracks and associated exercise metrics.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Add Category
                </button>
            </div>

            {/* Search */}
            <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search categories..."
                className="w-full sm:w-80 search-input-modern"
            />

            {/* Grid */}
            {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
            ) : filtered.length > 0 ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {paginatedCategories.map((cat) => {
                            const initials = cat.name.slice(0, 4);
                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => router.push(`/categories/${cat.id}`)}
                                    role="button"
                                    tabIndex={0}
                                    className="relative bg-card rounded-2xl border border-white/10 p-6 shadow-lg transition-all duration-300 ease-out flex flex-col justify-between h-full hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.3)] group"
                                >
                                    {/* Actions (hover) */}
                                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEdit(cat); }}
                                            title="Edit"
                                            className="p-2 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-white/10 transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setToDelete(cat); }}
                                            title="Delete"
                                            className="p-2 rounded-md text-muted-foreground hover:text-red-400 hover:bg-white/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="w-12 h-12 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                                            {initials}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition-colors">
                                                {cat.name}
                                            </h3>
                                            {cat.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                    {cat.description}
                                                </p>
                                            )}

                                            {cat.difficulty && (
                                                <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                                                    {cat.difficulty}
                                                </span>
                                            )}

                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Dumbbell className="w-4 h-4 text-muted-foreground/70" />
                                                <span>{cat.exerciseCount} exercises</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 2. Paginarea este in afara grid-ului, pe toata latimea */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filtered.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </div>
            ) : (
                <div className="text-center py-16 bg-card rounded-2xl border border-white/10 shadow-sm">
                    <p className="text-muted-foreground text-sm">No categories found.</p>
                </div>
            )}

            {/* ===== Modal Create/Edit ===== */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setModalOpen(false)}
                >
                    <form
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={handleSave}
                        className="w-full max-w-md bg-card rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {editing ? "Edit Category" : "New Category"}
                            </h2>
                            <button type="button" onClick={() => setModalOpen(false)}
                                    className="p-1 rounded-md text-muted-foreground hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ex. Backend"
                                autoFocus
                                className="w-full h-10 rounded-lg border border-white/10 bg-transparent px-3 search-input-modern"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Short description…"
                                rows={3}
                                className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 search-input-modern resize-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">Difficulty</label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full h-10 rounded-lg border border-white/10 bg-card px-3 text-sm text-foreground outline-none focus:border-blue-500"
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>

                        {error && <p className="text-sm text-red-400">{error}</p>}

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setModalOpen(false)}
                                    className="h-10 rounded-lg border border-white/10 px-4 text-sm hover:bg-white/5">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving}
                                    className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
                                {saving ? "Saving…" : editing ? "Save changes" : "Create"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ===== Confirmare ștergere ===== */}
            {toDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setToDelete(null)}
                >
                    <div onClick={(e) => e.stopPropagation()}
                         className="w-full max-w-sm bg-card rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold">Delete category?</h2>
                        <p className="text-sm text-muted-foreground">
                            Ești sigur că vrei să ștergi <span className="font-medium text-foreground">{toDelete.name}</span>? Acțiunea nu poate fi anulată.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setToDelete(null)}
                                    className="h-10 rounded-lg border border-white/10 px-4 text-sm hover:bg-white/5">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                    className="h-10 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50">
                                {deleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
