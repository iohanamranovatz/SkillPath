"use client";

import { useEffect, useState } from "react";
import { Plus, Check, X, Pencil, Trash2 } from "lucide-react";
import {
    getCategoryTags,
    addTag,
    updateTag,
    deleteTag,
} from "@/backend/categories";

type Tag = { id: number; name: string };

export function TagsManager({
    categoryId,
    initialTags,
    onChange,
}: {
    categoryId: number;
    initialTags: Tag[];
    onChange?: (tags: Tag[]) => void;
}) {
    const [tags, setTags] = useState<Tag[]>(initialTags);
    const [newName, setNewName] = useState("");
    const [editId, setEditId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function refresh() {
        const res = await getCategoryTags(categoryId);
        if (res.success) {
            setTags(res.data as Tag[]);
            onChange?.(res.data as Tag[]);
        }
    }
    useEffect(() => { setTags(initialTags); }, [initialTags]);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;
        setBusy(true); setError("");
        const res = await addTag({ categoryId, name: newName });
        setBusy(false);
        if (res.success) { setNewName(""); await refresh(); }
        else setError(res.message ?? "Eroare.");
    }

    async function handleSaveEdit(id: number) {
        setBusy(true); setError("");
        const res = await updateTag({ id, name: editName });
        setBusy(false);
        if (res.success) { setEditId(null); await refresh(); }
        else setError(res.message ?? "Eroare.");
    }

    async function handleDelete(id: number) {
        setBusy(true); setError("");
        const res = await deleteTag(id);
        setBusy(false);
        if (res.success) await refresh();
        else setError(res.message ?? "Eroare.");
    }

    return (
        <div className="space-y-3">
            {/* Add tag */}
            <form onSubmit={handleAdd} className="flex items-center gap-2">
                <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nume tag…"
                    className="h-10 rounded-lg border border-white/10 bg-transparent px-3 search-input-modern"
                />
                <button
                    disabled={busy}
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" /> Add Tag
                </button>
            </form>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* Tag pills */}
            {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {tags.map((t) =>
                        editId === t.id ? (
                            <span key={t.id} className="inline-flex items-center gap-1 rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-1">
                                <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    autoFocus
                                    className="bg-transparent text-sm outline-none w-24"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") { e.preventDefault(); handleSaveEdit(t.id); }
                                        if (e.key === "Escape") setEditId(null);
                                    }}
                                />
                                <button onClick={() => handleSaveEdit(t.id)} title="Save"
                                        className="text-green-400 hover:text-green-300">
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditId(null)} title="Cancel"
                                        className="text-muted-foreground hover:text-foreground">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ) : (
                            <span key={t.id} className="group inline-flex items-center gap-1.5 table-badge badge-category">
                                {t.name}
                                <button
                                    onClick={() => { setEditId(t.id); setEditName(t.name); }}
                                    title="Edit"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-blue-400"
                                >
                                    <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    title="Delete"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </span>
                        )
                    )}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">Nicio etichetă încă.</p>
            )}
        </div>
    );
}
