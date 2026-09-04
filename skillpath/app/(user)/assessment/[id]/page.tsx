import { redirect } from "next/navigation";
import { createClient } from "@/helper/supabase/server";
import { AssessmentRunner } from "@/frontend/user/components/assessment-runner";
import { InitialAssessmentRunner } from "@/frontend/user/components/initial-assessment-runner";
import { isInitialAssessment } from "@/backend/user/assessments/initial/initialAssessmentLifecycle";

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();

    const { id } = await params;
    const assessmentId = Number(id);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/");

    // auth.getUser() gives the uuid; take the bigint id from the users table
    const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_key", auth.user.id)
        .single();
    if (!dbUser) redirect("/");

    // fetch the test and check that it belongs to the logged-in user
    const { data: assessment } = await supabase
        .from("assessments")
        .select("id, user_id, status")
        .eq("id", assessmentId)
        .single();

    if (!assessment || assessment.user_id !== dbUser.id) redirect("/userDashboard");

    // if it is already completed, do not let them retake it (results = #7)
    if (assessment.status === "completed") redirect("/userDashboard");

    // load the test questions from assessment_answers -> questions (WITHOUT correct_answer!)
    const { data: rows } = await supabase
        .from("assessment_answers")
        .select("question_id, selected_option_id, questions ( question_text, difficulty, options )")
        .eq("assessment_id", assessmentId)
        .order("id", { ascending: true });

    const questions = (rows ?? []).map((r: any) => ({
        id: r.question_id,
        question_text: r.questions?.question_text ?? "",
        difficulty: r.questions?.difficulty ?? "",
        options: Array.isArray(r.questions?.options) ? r.questions.options : [],
        selectedOptionId: r.selected_option_id, // for resuming (null until submit)
    }));
    const initialAssessment = await isInitialAssessment(assessmentId);

    return (
        <main className="mx-auto max-w-2xl p-4 md:p-6">
            {initialAssessment ? (
                <InitialAssessmentRunner assessmentId={assessmentId} questions={questions} />
            ) : (
                <AssessmentRunner assessmentId={assessmentId} questions={questions} />
            )}
        </main>
    );
}
