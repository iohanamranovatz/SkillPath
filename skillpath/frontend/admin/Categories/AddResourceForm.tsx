"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addResource } from "@/backend/categories";

export function AddResourceForm({ categoryId }: { categoryId: number }) {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [type, setType] = useState("article");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) { setMsg("Please add a title."); return; }

        setLoading(true);
        const res = await addResource({ categoryId, title, url, type });
        setLoading(false);
        setMsg(res.message ?? "");

        if (res.success) {
            setTitle(""); setUrl(""); setType("article");
            router.refresh(); // reload the server component data
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 mb-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
                   placeholder="Title" className="search-input-modern" />

            <input value={url} onChange={(e) => setUrl(e.target.value)}
                   placeholder="URL" className="search-input-modern" />

            <select value={type} onChange={(e) => setType(e.target.value)}
                    className="search-input-modern">
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="course">Course</option>
            </select>

            <button
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
                {loading ? "Adding…" : "+ Add Resource"}
            </button>

            {msg && <span className="text-sm text-muted-foreground self-center">{msg}</span>}
        </form>
    );
}
