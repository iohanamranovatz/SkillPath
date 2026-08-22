"use client";

import { Question} from "@/frontend/admin/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Eye, Trash2 } from "lucide-react";

interface Props {
    questions: Question[];
    onDelete?: (id: string) => void;
}

export default function QuestionTable({ questions, onDelete }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeId = searchParams.get("id");

    const openPanel = (id: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("id", id);
        router.push(`${pathname}?${params.toString()}`);
    };

    const getDifficultyClass = (diff: string) => {
        switch (diff) {
            case "EASY": return "badge-diff-easy";
            case "MEDIUM": return "badge-diff-medium";
            case "HARD": return "badge-diff-hard";
            default: return "bg-muted text-muted-foreground";
        }
    };

    return (
        <div className="data-table-container">
            <table className="data-table">
                <thead className="data-table-header">
                <tr>
                    <th className="data-table-th">Title</th>
                    <th className="data-table-th">Category</th>
                    <th className="data-table-th">Difficulty</th>
                    <th className="data-table-th">Status</th>
                    <th className="data-table-th text-right">Actions</th>
                </tr>
                </thead>
                <tbody>
                {questions.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="h-24 text-center text-muted-foreground">
                            No questions found.
                        </td>
                    </tr>
                ) : (
                    questions.map((q) => (
                        <tr
                            key={q.id}
                            onClick={() => openPanel(q.id)}
                            className={`data-table-row cursor-pointer ${
                                activeId === q.id ? "bg-white/[0.06]" : ""
                            }`}
                        >
                            <td className="data-table-td font-medium text-foreground">{q.title}</td>
                            <td className="data-table-td">
                                <span className="table-badge badge-category">
                                    {q.categoryId}
                                </span>
                            </td>
                            <td className="data-table-td">
                                <span className={`table-badge ${getDifficultyClass(q.difficulty)}`}>
                                    {q.difficulty}
                                </span>
                            </td>
                            <td className="data-table-td">
                                {q.isActive ? (
                                    <span className="table-badge badge-status-active">
                                        Active
                                    </span>
                                ) : (
                                    <span className="table-badge badge-status-draft">
                                        Draft
                                    </span>
                                )}
                            </td>
                            <td className="data-table-td text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openPanel(q.id);
                                        }}
                                        className="action-btn"
                                        title="View Details"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete?.(q.id);
                                        }}
                                        aria-label={`Delete question ${q.id}`}
                                        className="group inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive active:scale-90"
                                    >
                                        <Trash2 className="size-4 transition-transform group-hover:scale-110" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );
}