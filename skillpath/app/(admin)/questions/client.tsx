"use client";

import QuestionToolbar from "@/frontend/admin/Questions/toolbar";
import QuestionTable from "@/frontend/admin/Questions/table";
import QuestionPanel from "@/frontend/admin/Questions/panel";
import AdminSidebar from "@/frontend/admin/components/Sidebar";
import AdminHeader from "@/frontend/admin/components/Header";
import AdminFooter from "@/frontend/admin/components/Footer";
import { useMemo, useState } from "react";
import {Question} from "@/frontend/admin/lib/types";

export default function QuestionBankClient({ initialQuestions }: { initialQuestions: Question[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [difficulty, setDifficulty] = useState("all");

    const filteredQuestions = useMemo(() => {
        return initialQuestions.filter((q) => {
            // Add a fallback (q.title || "") so it never tries to lowercase undefined
            const safeTitle = q.title || "";
            const matchesSearch = safeTitle.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDifficulty = difficulty === "all" || q.difficulty === difficulty;
            return matchesSearch && matchesDifficulty;
        });
    }, [searchTerm, difficulty, initialQuestions]);

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />
            <div className="flex flex-1 flex-col">
                <AdminHeader />
                <main className="flex-1 bg-background p-8 text-foreground">
                    <div className="relative flex h-full min-h-screen w-full flex-col bg-background text-foreground">
                        <div className="flex-1 overflow-y-auto p-2">
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
                        <QuestionPanel questions={initialQuestions} />
                    </div>
                </main>
                <AdminFooter />
            </div>
        </div>
    );
}