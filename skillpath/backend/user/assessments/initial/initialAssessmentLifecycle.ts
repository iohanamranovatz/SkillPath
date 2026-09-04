import { createClient } from "@/helper/supabase/server";

export const INITIAL_ASSESSMENT_QUESTION_COUNT = 30;

export type InitialAssessmentOnboardingState = {
    requiresInitialAssessment: boolean;
    activeInitialAssessmentId: number | null;
    completedInitialAssessmentId: number | null;
};

type AssessmentStatus = "in_progress" | "completed" | string;

type UserAssessmentRow = {
    id: number;
    status: AssessmentStatus;
};

function getCountForAssessment(
    answerCountByAssessmentId: Map<number, number>,
    assessmentId: number
) {
    return answerCountByAssessmentId.get(assessmentId) ?? 0;
}

export async function isInitialAssessment(assessmentId: number) {
    const supabase = await createClient();

    if (!assessmentId) {
        throw new Error("Assessment ID is required.");
    }

    const { count, error } = await supabase
        .from("assessment_answers")
        .select("id", { count: "exact", head: true })
        .eq("assessment_id", assessmentId);

    if (error) {
        throw new Error(`Failed to load assessment answers: ${error.message}`);
    }

    return (count ?? 0) === INITIAL_ASSESSMENT_QUESTION_COUNT;
}

export async function getInitialAssessmentOnboardingState(
    userId: number
): Promise<InitialAssessmentOnboardingState> {
    const supabase = await createClient();

    if (!userId) {
        throw new Error("User ID is required.");
    }

    const { data: assessments, error: assessmentsError } = await supabase
        .from("assessments")
        .select("id, status")
        .eq("user_id", userId)
        .in("status", ["in_progress", "completed"]);

    if (assessmentsError) {
        throw new Error(`Failed to load assessments: ${assessmentsError.message}`);
    }

    const userAssessments = (assessments ?? []) as UserAssessmentRow[];
    if (userAssessments.length === 0) {
        return {
            requiresInitialAssessment: true,
            activeInitialAssessmentId: null,
            completedInitialAssessmentId: null,
        };
    }

    const assessmentIds = userAssessments.map((assessment) => assessment.id);

    const { data: answerRows, error: answersError } = await supabase
        .from("assessment_answers")
        .select("assessment_id")
        .in("assessment_id", assessmentIds);

    if (answersError) {
        throw new Error(`Failed to load assessment answers: ${answersError.message}`);
    }

    const answerCountByAssessmentId = new Map<number, number>();
    for (const row of answerRows ?? []) {
        const key = row.assessment_id;
        answerCountByAssessmentId.set(key, (answerCountByAssessmentId.get(key) ?? 0) + 1);
    }

    const initialAssessments = userAssessments.filter(
        (assessment) =>
            getCountForAssessment(answerCountByAssessmentId, assessment.id) ===
            INITIAL_ASSESSMENT_QUESTION_COUNT
    );

    const activeInitialAssessmentId =
        initialAssessments.find((assessment) => assessment.status === "in_progress")?.id ?? null;
    const completedInitialAssessmentId =
        initialAssessments.find((assessment) => assessment.status === "completed")?.id ?? null;

    return {
        requiresInitialAssessment: completedInitialAssessmentId === null && userAssessments.length == 0,
        activeInitialAssessmentId,
        completedInitialAssessmentId,
    };
}
