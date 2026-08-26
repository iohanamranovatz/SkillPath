import {Check, Flame, Plus, Search, Trash2} from "lucide-react"
import { PageHeading } from "./page-heading"
import { Card } from "@/frontend/user/common/card"
import { Button } from "@/frontend/user/common/button"
import {useState} from "react";
import {updateProfile} from "@/backend/user/updateProfile";
import { ProfileViewProps } from "@/frontend/user/lib/types";
import {addObjective, deleteObjective, toggleInterestTag, toggleObjective} from "@/backend/user/profileActions";

export function ProfileView({
    initialData,
    objectives = [],
    userInterestTagIds = [],
    allTags = []
}: ProfileViewProps) {

    const [message, setMessage] = useState<string | null>(null);
    const [newObjective, setNewObjective] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "incompleted">("all");

    async function handleSubmit(formData: FormData) {
        setMessage(null);
        const response = await updateProfile(formData);
        setMessage(response.message);
    }

    const handleAddObjective = async () => {
        if (!newObjective.trim()) return;

        await addObjective(initialData.id, newObjective);
        setNewObjective("");
    }

    const filteredObjectives = objectives.filter((obj) => {
        const matchesSearch = obj
            .title
            .toLowerCase()
            .includes(
                searchQuery.toLowerCase()
            );

        const matchesFilter =
            filterStatus === "all"
                ? true
                :filterStatus === "completed"
                ? obj.is_completed
                : !obj.is_completed;

        return matchesSearch && matchesFilter;
    });

    const completedCount = objectives
        .filter(
            (objective) => objective.is_completed
        ).length;

    return (
        <div className="space-y-6">
            <PageHeading
                title="Profile"
                description="Manage your learning identity and preferences."
            />

            <Card className="max-w-3xl space-y-7 p-7" >
                <form action={handleSubmit} className="space-y-7">
                    <div className="flex flex-wrap items-center gap-5 border-b border-border pb-7">
                        <div className="flex size-20 items-center justify-center rounded-full bg-primary/20 text-2xl font-semibold text-primary">
                            {(initialData?.name || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">{initialData?.name}</h2>
                            <p className="text-sm text-muted-foreground">
                                {initialData?.role} · {initialData?.email}
                            </p>
                        </div>
                    </div>

                    {message && (
                        <p className="text-sm font-medium text-primary">
                            {message}
                        </p>
                    )}

                    {/* Name */}
                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="space-y-2 text-sm text-muted-foreground">
                            Full name
                            <input
                                name="fullName"
                                className="block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring"
                                defaultValue={initialData?.name || ""}
                            />
                        </label>

                        <div className="space-y-2 text-sm text-muted-foreground">
                            <span>Experience level</span>
                            <div className="block w-full rounded-lg border border-border/50 bg-card/50 px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed">
                                {initialData?.estimated_level || "Junior"}
                            </div>
                        </div>
                    </div>

                    <Button type="submit">Save changes</Button>
                </form>
            </Card>

            <Card className="space-y-5 p-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h3 className="text-lg font-semibold">My Objectives</h3>
                        <p className="text-xs text-muted-foreground">Add and track your learning goals.</p>
                    </div>
                    {objectives.length > 0 && (
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
                            {completedCount} of {objectives.length} completed
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="e.g. Master React Hooks"
                        className="block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                    />
                    <Button onClick={handleAddObjective} type="button" className="inline-flex items-center gap-1">
                        <Plus className="size-4" /> Add
                    </Button>
                </div>

                {objectives.length > 0 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/40 pt-4">
                        {/* Input Căutare */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search objectives..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-border bg-card/50 pl-9 pr-3 py-1.5 text-xs text-foreground outline-none focus:border-ring"
                            />
                        </div>

                        <div className="flex items-center gap-1 rounded-lg bg-card p-1 border border-border">
                            {(["all", "completed", "incompleted"] as const).map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFilterStatus(status)}
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                                        filterStatus === status
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    {filteredObjectives.length === 0 ? (
                        <p className="py-4 text-center text-xs text-muted-foreground">
                            {objectives.length === 0
                                ? "No objectives added yet."
                                : "No objectives match your search/filter."}
                        </p>
                    ) : (
                        filteredObjectives.map((obj) => (
                            <div
                                key={obj.id}
                                className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-3"
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleObjective(obj.id, obj.is_completed)}
                                        className={`flex size-5 items-center justify-center rounded border transition-colors ${
                                            obj.is_completed
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-border"
                                        }`}
                                    >
                                        {obj.is_completed && <Check className="size-3.5" />}
                                    </button>
                                    <span
                                        className={`text-sm ${
                                            obj.is_completed ? "line-through text-muted-foreground" : "text-foreground"
                                        }`}
                                    >
                                        {obj.title}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        const confirmed = window.confirm(
                                            `Are you sure you want to delete "${obj.title}"?`
                                        );
                                        if (confirmed) {
                                            await deleteObjective(obj.id);
                                        }
                                    }}
                                    className="text-muted-foreground hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/*<div className="space-y-2">*/}
                {/*    {objectives.length === 0 ? (*/}
                {/*        <p className="text-sm text-muted-foreground">No objectives added yet.</p>*/}
                {/*    ) : (*/}
                {/*        objectives.map((obj) => (*/}
                {/*            <div*/}
                {/*                key={obj.id}*/}
                {/*                className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-3"*/}
                {/*            >*/}
                {/*                <div className="flex items-center gap-3">*/}
                {/*                    <button*/}
                {/*                        type="button"*/}
                {/*                        onClick={() => toggleObjective(obj.id, obj.is_completed)}*/}
                {/*                        className={`flex size-5 items-center justify-center rounded border transition-colors ${*/}
                {/*                            obj.is_completed*/}
                {/*                                ? "bg-primary border-primary text-primary-foreground"*/}
                {/*                                : "border-border"*/}
                {/*                        }`}*/}
                {/*                    >*/}
                {/*                        {obj.is_completed && <Check className="size-3.5" />}*/}
                {/*                    </button>*/}
                {/*                    <span className={`text-sm ${obj.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>*/}
                {/*                        {obj.title}*/}
                {/*                    </span>*/}
                {/*                </div>*/}

                {/*                <button*/}
                {/*                    type="button"*/}
                {/*                    onClick={async () => {*/}
                {/*                        const confirmed = window.confirm(`Are you sure you want to delete "${obj.title}"?`);*/}

                {/*                        if (confirmed)*/}
                {/*                            await deleteObjective(obj.id);*/}
                {/*                    }}*/}
                {/*                    className="text-muted-foreground hover:text-red-400 transition-colors"*/}
                {/*                >*/}
                {/*                    <Trash2 className="size-4" />*/}
                {/*                </button>*/}
                {/*            </div>*/}
                {/*        ))*/}
                {/*    )}*/}
                {/*</div>*/}
            </Card>

            <Card className="space-y-4 p-7">
                <div>
                    <h3 className="text-lg font-semibold">Interests & Topics</h3>
                    <p className="text-xs text-muted-foreground">Select topics you want to focus on.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                        const isSelected = userInterestTagIds.includes(tag.id);
                        return (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleInterestTag(initialData.id, tag.id, isSelected)}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                                    isSelected
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-card text-muted-foreground border-border hover:border-foreground"
                                }`}
                            >
                                {tag.name} {isSelected ? "✓" : "+"}
                            </button>
                        );
                    })}
                </div>
            </Card>

        </div>
    )
}
