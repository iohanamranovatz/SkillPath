"use client";

import QuestionToolbar from "@/frontend/admin/Questions/toolbar";
import QuestionTable from "@/frontend/admin/Questions/table";
import QuestionPanel from "@/frontend/admin/Questions/panel";
import AdminSidebar from "@/frontend/admin/components/Sidebar";
import AdminHeader from "@/frontend/admin/components/Header";
import AdminFooter from "@/frontend/admin/components/Footer";
import { useMemo, useState } from "react";
import {Question} from "@/frontend/admin/lib/types";
import Pagination from "@/frontend/components/pagination";

// paginare -> numarul de intrebari per pagina
const ITEMS_PER_PAGE = 6;

export default function QuestionBankClient({ initialQuestions }: { initialQuestions: Question[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [difficulty, setDifficulty] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredQuestions = useMemo(() => {
        return initialQuestions.filter((q) => {
            // Add a fallback (q.title || "") so it never tries to lowercase undefined
            const safeTitle = q.title || "";
            const matchesSearch = safeTitle.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDifficulty = difficulty === "all" || q.difficulty === difficulty;
            return matchesSearch && matchesDifficulty;
        });
    }, [searchTerm, difficulty, initialQuestions]);

    const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE) || 1;

    const paginatedQuestions = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredQuestions, currentPage]);


    return (
        <div className="relative flex h-full min-h-screen w-full flex-col bg-background text-foreground">
            <div className="flex-1 overflow-y-auto p-2">
                {/* Main Content Card */}
                <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card p-4 shadow-xl sm:p-6 backdrop-blur-xl">
                    <QuestionToolbar
                        searchTerm={searchTerm}
                        onSearchChange={(val) => {
                            setSearchTerm(val);
                            setCurrentPage(1);
                        }}
                        difficulty={difficulty}
                        onDifficultyChange={(val) => {
                            setDifficulty(val);
                            setCurrentPage(1);
                        }}
                    />
                    <QuestionTable questions={paginatedQuestions} />

                    {/* Paginare */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredQuestions.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={(newPage) => setCurrentPage(newPage)}
                    />

                </div>
            </div>
            {/* Slide-in Detail Panel */}
            <QuestionPanel questions={initialQuestions} />
        </div>
    );
}