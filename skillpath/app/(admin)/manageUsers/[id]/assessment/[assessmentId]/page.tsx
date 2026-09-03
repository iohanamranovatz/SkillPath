import { redirect } from "next/navigation";
import supabase from "@/helper/SupabaseClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {AssessmentViewer} from "@/frontend/admin/ManageUsers/assessment-viewer";
import {Button} from "@/frontend/user/common/button";
import {router} from "next/client";
import {isInitialAssessment} from "@/backend/user/assessments/initial/initialAssessmentLifecycle";

export const dynamic = "force-dynamic";

type AdminAssessmentPageProps = {
    params: Promise<{
        id: string;
        assessmentId: string;
    }>;
};

export default async function AdminAssessmentResultsPage({ params }: AdminAssessmentPageProps) {
    const { id, assessmentId: rawAssessmentId } = await params;
    const userId = Number(id);
    const assessmentId = Number(rawAssessmentId);

    // 1. Preluăm datele testului
    const { data: assessment } = await supabase
        .from("assessments")
        .select("id, user_id, status, score_total, started_at")
        .eq("id", assessmentId)
        .single();

    if (!assessment || Number(assessment.user_id) !== userId) {
        redirect(`/manageUsers/${userId}`);
    }

    // 2. Extragerea întrebărilor și a răspunsurilor date de utilizator
    const { data: rows } = await supabase
        .from("assessment_answers")
        .select(`
            question_id, 
            selected_option_id,
            is_correct,
            questions ( 
                question_text, 
                difficulty, 
                options,
                correct_answer,
                categories (
                    name
                )
            )
        `)
        .eq("assessment_id", assessmentId)
        .order("id", { ascending: true });

    const questions = (rows ?? []).map((r: any) => ({
        id: r.question_id,
        question_text: r.questions?.question_text ?? "",
        difficulty: r.questions?.difficulty ?? "",
        options: Array.isArray(r.questions?.options) ? r.questions.options : [],
        selectedOptionId: r.selected_option_id,
        isCorrect: r.is_correct,
        correctAnswer: r.questions?.correct_answer
    }));
    const isInitial = await isInitialAssessment(assessmentId);

    //  Extract category from the first question's joined data
    // Supabase returns nested objects, so it looks like: r.questions.categories.name
    const categoryName =  isInitial ? "Initial Assessment" : ((rows?.[0] as any)?.questions?.categories?.name || "General") ;

    return (
        <main className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
            <Link
                href={`/manageUsers/${userId}`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="size-4" /> Back to User Details
            </Link>

            <AssessmentViewer
                assessmentId={assessmentId}
                score={assessment.score_total ?? 0}
                questions={questions}
                details={{
                    category: categoryName,
                    dateStarted: assessment.started_at ? new Date(assessment.started_at).toLocaleDateString("ro-RO") : "-"
                }}
            />
        </main>
    );
}