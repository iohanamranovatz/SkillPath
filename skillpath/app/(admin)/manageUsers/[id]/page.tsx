import {PageProps} from "@/frontend/admin/lib/types";
import { createClient } from "@/helper/supabase/server";
import Link from "next/link";
import {AlertTriangle, ArrowLeft, BookOpen, CheckCircle, Clock, ExternalLink} from "lucide-react";
import {getWeakCategories} from "@/backend/admin/getWeakCategories";
import ResourceFilters from "@/app/(admin)/manageUsers/[id]/ResourceFilters";

export const dynamic = "force-dynamic";

type UserDetailsProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{
        category?: string;
        page?: string;
    }>;
};

export default async function UserDetailsPage({ params, searchParams }: UserDetailsProps) {
    const supabase = await createClient();

    const { id } = await params;
    const userId = parseInt(id, 10);
    const { category, page } = await searchParams;

    const currentPage = parseInt(page || "1", 10);
    const pageSize = 6; // Numarul de resurse per pagina

    const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    // extragem toate evaluarile asociate utilizatorului,
    // ordonate descrescator dupa data de incepere
    const { data: assessments, error: assessmentsError } = await supabase
        .from("assessments")
        .select("*")
        .eq("user_id", userId)
        .order("started_at", { ascending: false });

    const weakCategories = await getWeakCategories(userId);

    // 2. Preluam resursele recomandate pentru categoriile slabe ale utilizatorului
    const weakCategoryIds = weakCategories.map((cat) => cat.categoryId);
    let recommendedResources: any[] = [];

    if (weakCategoryIds.length > 0) {
        const { data: resources } = await supabase
            .from("learning_resources")
            .select(`
                id,
                title,
                url,
                type,
                category_id,
                categories ( name )
            `)
            .in("category_id", weakCategoryIds);

        recommendedResources = resources || [];
    }

    // 3. Preluam progresul completat al utilizatorului
    const { data: userProgress } = await supabase
        .from("user_progress")
        .select("resource_id, is_completed")
        .eq("user_id", userId);

    const completedResourceIds = new Set(
        (userProgress || []).filter((p) => p.is_completed).map((p) => p.resource_id)
    );

    // 4. Mapam starea resurselor pentru utilizator
    const resourcesWithStatus = recommendedResources.map((res: any) => ({
        id: res.id,
        title: res.title,
        url: res.url,
        type: res.type,
        categoryId: res.category_id,
        categoryName: res.categories?.name || "General",
        isCompleted: completedResourceIds.has(res.id),
    }));

    const totalResourcesCount = resourcesWithStatus.length;
    const completedResourcesCount = resourcesWithStatus.filter((r) => r.isCompleted).length;
    const resourceProgressPercentage = totalResourcesCount > 0
        ? Math.round((completedResourcesCount / totalResourcesCount) * 100)
        : 0;

    // 4. Filtrarea resurselor pe categorie
    const filteredResources = category && category !== "all"
        ? resourcesWithStatus.filter((r) => r.categoryId.toString() === category)
        : resourcesWithStatus;

    // 5. Paginarea resurselor filtrate
    const totalFilteredPages = Math.ceil(filteredResources.length / pageSize) || 1;
    const paginatedResources = filteredResources.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    if (userError || !user) {
        return (
            <div className="p-8 text-foreground">
                <p className="text-red-500">User not found!</p>
                <Link href="/manageUsers" className="mt-4 inline-block text-blue-500 hover:underline">
                    &larr; Back to User Management
                </Link>
            </div>
        );
    }

    const totalCompleted = assessments?.filter((a) => a.status === "completed").length || 0;
    const avgScore =
        assessments && assessments.length > 0
            ? (
                assessments.reduce((acc, curr) => acc + (curr.score_total || 0), 0) / assessments.length
            ).toFixed(1)
            : 0;

    return (
        <div className="min-h-screen bg-background p-8 text-foreground space-y-8">
            {/* Buton inapoi */}
            <Link
                href="/manageUsers"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="size-4" /> Back to User Management
            </Link>

            {/* Header Profil */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-card p-6 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="flex size-16 items-center justify-center rounded-full bg-blue-600/20 text-xl font-bold text-blue-400">
                        {user.name?.slice(0, 2).toUpperCase() || "U"}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{user.name}</h1>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider border border-white/10">
                        {user.estimated_level || "JUNIOR"}
                    </span>

                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
                        {user.role || "user"}
                    </span>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-card p-5">
                    <p className="text-xs text-muted-foreground">Taken Tests</p>
                    <p className="text-2xl font-bold mt-1">{assessments?.length || 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-card p-5">
                    <p className="text-xs text-muted-foreground">Completed Tests</p>
                    <p className="text-2xl font-bold mt-1 text-green-400">{totalCompleted}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-card p-5">
                    <p className="text-xs text-muted-foreground">Overall Average Score</p>
                    <p className="text-2xl font-bold mt-1 text-blue-400">{avgScore} pts</p>
                </div>

                {/* Resurse Parcurse */}
                <div className="rounded-2xl border border-white/10 bg-card p-5">
                    <p className="text-xs text-muted-foreground">Resources Completed</p>
                    <p className="text-2xl font-bold mt-1 text-purple-400">
                        {completedResourcesCount} / {totalResourcesCount}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {resourceProgressPercentage}% progress
                    </p>
                </div>
            </div>

             {/*Weak Categories*/}
            <div className="rounded-2xl border border-white/10 bg-card p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-amber-400" />
                    <h2 className="text-lg font-semibold">User Weak Categories</h2>
                </div>

                {weakCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                        No weak areas detected or no assessments taken yet.
                    </p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {weakCategories.map((cat) => (
                            <div key={cat.categoryId} className="space-y-2 rounded-xl border border-white/5 bg-white/5 p-4">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-foreground">{cat.categoryName}</span>
                                    <span className="text-xs font-semibold text-red-400">
                                        {cat.errorPercentage}% Error Rate ({cat.wrongAnswersCount}/{cat.totalAnswersCount})
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="h-full bg-red-500/80 transition-all duration-500"
                                        style={{ width: `${cat.errorPercentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Secțiune Progres Resurse cu Filtrare & Paginare */}
            <div className="rounded-2xl border border-white/10 bg-card p-6 shadow-xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <BookOpen className="size-5 text-blue-400" />
                        <h2 className="text-lg font-semibold">Learning Resources Progress</h2>
                    </div>

                    {/* Filtre si Paginare (Client Control) */}
                    <ResourceFilters
                        categories={weakCategories.map((wc) => ({ id: wc.categoryId, name: wc.categoryName }))}
                        selectedCategory={category || "all"}
                        currentPage={currentPage}
                        totalPages={totalFilteredPages}
                    />
                </div>

                {paginatedResources.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                        No resources found for the selected filter.
                    </p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {paginatedResources.map((res) => (
                            <div
                                key={res.id}
                                className={`p-4 border rounded-xl flex items-center justify-between gap-3 transition-colors ${
                                    res.isCompleted
                                        ? "bg-emerald-500/5 border-emerald-500/20"
                                        : "bg-white/5 border-white/5"
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className={`font-medium text-sm truncate ${
                                        res.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                                    }`}>
                                        {res.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-medium text-muted-foreground uppercase">
                                            {res.type}
                                        </span>
                                        <span className="text-[10px] text-amber-400 font-medium">
                                            {res.categoryName}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                        res.isCompleted
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    }`}>
                                        {res.isCompleted ? "Completed" : "Pending"}
                                    </span>

                                    <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1.5 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                                        title="Open link"
                                    >
                                        <ExternalLink className="size-3.5" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Istoric Teste (Tabel) */}
            <div className="rounded-2xl border border-white/10 bg-card p-6 shadow-xl space-y-4">
                <h2 className="text-lg font-semibold">Assessment History & Progress</h2>

                {assessmentsError && (
                    <p className="text-sm text-red-400">Error loading assessment history.</p>
                )}

                {!assessments || assessments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No assessments recorded for this user.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-white/10 text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="py-3 px-4">ID Assessment</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Obtained score</th>
                                    <th className="py-3 px-4">Start time</th>
                                    <th className="py-3 px-4">End time</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-white/5">
                            {assessments.map((item) => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4 font-mono text-xs">#{item.id}</td>
                                    <td className="py-3 px-4">
                                        {item.status === "completed" ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                                                <CheckCircle className="size-3.5" /> Completed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-xs text-yellow-400">
                                              <Clock className="size-3.5" /> In Progress
                                            </span>
                                        )}
                                    </td>

                                    <td className="py-3 px-4 font-semibold text-foreground">
                                        {item.score_total !== null ? `${item.score_total} pct` : "-"}
                                    </td>

                                    <td className="py-3 px-4 text-muted-foreground">
                                        {item.started_at ? new Date(item.started_at).toLocaleDateString("ro-RO") : "-"}
                                    </td>

                                    <td className="py-3 px-4 text-muted-foreground">
                                        {item.completed_at ? new Date(item.completed_at).toLocaleDateString("ro-RO") : "-"}
                                    </td>

                                    <td className="py-3 px-4 text-right">
                                        {item.status === "completed" && (
                                            <Link
                                                href={`/manageUsers/${userId}/assessment/${item.id}`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                <span>View Answers</span>
                                                <ExternalLink className="size-3" />
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}