"use client";

import QuestionToolbar from "@/frontend/admin/Questions/toolbar";
import QuestionTable from "@/frontend/admin/Questions/table";
import QuestionPanel from "@/frontend/admin/Questions/panel";
import { useMemo, useState } from "react";
import { Question } from "@/frontend/admin/lib/types";
import Pagination from "@/frontend/components/pagination";

const ITEMS_PER_PAGE = 6;

export default function QuestionBankClient({ initialQuestions }: { initialQuestions: Question[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [difficulty, setDifficulty] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredQuestions = useMemo(() => {
        return initialQuestions.filter((q) => {
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
        <div className="flex flex-col gap-6">

            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Question Bank</h1>
                <p className="text-sm text-muted-foreground">Manage and configure software question metrics and entries.</p>
            </div>

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

            <QuestionPanel questions={initialQuestions} />
        </div>
    );
}