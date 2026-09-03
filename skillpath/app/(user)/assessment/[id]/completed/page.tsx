import { redirect } from "next/navigation";
import { supabase } from "@/helper/SupabaseClient";
import { AssessmentViewer} from "@/frontend/user/components/assessmen-viewer";
import { isInitialAssessment } from "@/backend/user/assessments/initial/initialAssessmentLifecycle";

export default async function AssessmentResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const assessmentId = Number(id);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/");

    const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_key", auth.user.id)
        .single();
    if (!dbUser) redirect("/");

    const { data: assessment } = await supabase
        .from("assessments")
        .select("id, user_id, status, score_total, started_at")
        .eq("id", assessmentId)
        .single();

    if (!assessment || Number(assessment.user_id) !== Number(dbUser.id)) {
        redirect("/userDashboard");
    }

    if (assessment.status !== "completed") {
        redirect(`/assessment/${assessmentId}`);
    }

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
        <main className="mx-auto max-w-2xl p-4 md:p-6">
            <AssessmentViewer
                assessmentId={assessmentId}
                score={assessment.score_total ?? 0}
                questions={questions}
                details={{
                    category: categoryName,
                    dateStarted: assessment.started_at
                }}
            />
        </main>
    );
}