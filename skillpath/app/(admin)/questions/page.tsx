"use client";

import { MOCK_QUESTIONS} from "@/frontend/admin/lib/mock-data";
import QuestionToolbar from "@/frontend/admin/Questions/toolbar";
import QuestionTable from "@/frontend/admin/Questions/table";
import QuestionPanel from "@/frontend/admin/Questions/panel";
import AdminSidebar from "@/frontend/admin/components/Sidebar";
import AdminHeader from "@/frontend/admin/components/Header";
import AdminFooter from "@/frontend/admin/components/Footer";
import { useMemo, useState } from "react";

export default function QuestionBankPage({
                                             searchParams,
                                         }: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [difficulty, setDifficulty] = useState("all");

    const filteredQuestions = useMemo(() => {
        return MOCK_QUESTIONS.filter((q) => {
            const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDifficulty = difficulty === "all" || q.difficulty === difficulty;
            return matchesSearch && matchesDifficulty;
        });
    }, [searchTerm, difficulty]);

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />

            <div className="flex flex-1 flex-col">
                <AdminHeader />

                <main className="flex-1 bg-background p-8 text-foreground">
                    <div className="relative flex h-full min-h-screen w-full flex-col bg-background text-foreground">
                        <div className="flex-1 overflow-y-auto p-2">

                            {/* Header Area */}
                            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Question Bank</h1>
                                    <p className="text-muted-foreground mt-1 text-sm">Manage, edit, and organize assessment questions.</p>
                                </div>
                                <button className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30">
                                    + Add Question
                                </button>
                            </div>

                            {/* Main Content Card */}
                            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card p-4 shadow-xl sm:p-6 backdrop-blur-xl">
                                <QuestionToolbar
                                    searchTerm={searchTerm}
                                    onSearchChange={setSearchTerm}
                                    difficulty={difficulty}
                                    onDifficultyChange={setDifficulty}
                                />
                                <QuestionTable questions={filteredQuestions} />
                            </div>
                        </div>

                        {/* Slide-in Detail Panel */}
                        <QuestionPanel questions={MOCK_QUESTIONS} />
                    </div>
                </main>
                <AdminFooter />
            </div>
        </div>
    );
}