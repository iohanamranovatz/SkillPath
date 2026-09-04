"use server";

import { createInitialAssessment, submitInitialAssessment } from "@/backend/user/assessments/initial/manageInitialTest";
import {
    getInitialAssessmentOnboardingState,
    isInitialAssessment,
} from "@/backend/user/assessments/initial/initialAssessmentLifecycle";
import { createClient } from "@/helper/supabase/server";
const REQUIRED_ANSWERS_PER_TIER = 6;

type AssessmentAnswerPayload = {
    questionId: number;
    optionId: string;
};

function inferLevelFromInitialScores(scoresByTier: number[]) {
    let level = "Beginner";

    if ((scoresByTier[0] ?? 0) > REQUIRED_ANSWERS_PER_TIER) {
        level = "Intermediate";
        if ((scoresByTier[1] ?? 0) > REQUIRED_ANSWERS_PER_TIER ) {
            level = "Advanced";
        }
    }

    return level;
}

export async function startInitialAssessment(userId: number) {
    try {
        if (!userId) {
            return { success: false, message: "User ID is required.", data: null };
        }

        const onboardingState = await getInitialAssessmentOnboardingState(userId);

        if (onboardingState.activeInitialAssessmentId) {
            return {
                success: true,
                message: "Resumed existing initial assessment.",
                data: { assessmentId: onboardingState.activeInitialAssessmentId, resumed: true },
            };
        }

        if (!onboardingState.requiresInitialAssessment) {
            return {
                success: false,
                message: "Initial assessment already completed.",
                data: null,
            };
        }

        const createdAssessment = await createInitialAssessment(userId);
        if (!createdAssessment.success || !createdAssessment.data?.assessmentId) {
            return {
                success: false,
                message: createdAssessment.message ?? "Unable to create initial assessment.",
                data: null,
            };
        }

        return {
            success: true,
            message: "Initial assessment started.",
            data: { assessmentId: createdAssessment.data.assessmentId, resumed: false },
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to start initial assessment.";
        return { success: false, message, data: null };
    }
}

export async function submitInitialAssessmentAction(
    assessmentId: number,
    answers: AssessmentAnswerPayload[]
) {
    const supabase = await createClient();

    try {
        if (!assessmentId || answers.length === 0) {
            return { success: false, message: "Assessment submission is invalid.", data: null };
        }

        const initialAssessment = await isInitialAssessment(assessmentId);
        if (!initialAssessment) {
            return {
                success: false,
                message: "This assessment is not an initial onboarding assessment.",
                data: null,
            };
        }

        const scoresByTier = await submitInitialAssessment(assessmentId, answers);
        const level = inferLevelFromInitialScores(scoresByTier);
        const correct = scoresByTier.reduce((acc, current) => acc + current, 0);

        const { data: owner, error: ownerError } = await supabase
            .from("assessments")
            .select("user_id")
            .eq("id", assessmentId)
            .single();

        if (ownerError || !owner?.user_id) {
            return {
                success: false,
                message: ownerError?.message ?? "Unable to resolve assessment owner.",
                data: null,
            };
        }

        const { error: levelUpdateError } = await supabase
            .from("users")
            .update({ estimated_level: level })
            .eq("id", owner.user_id);

        if (levelUpdateError) {
            return { success: false, message: levelUpdateError.message, data: null };
        }

        const total = answers.length;
        const scorePct = Math.round((correct / total) * 100);

        return {
            success: true,
            data: {
                correct,
                total,
                scorePct,
                level,
                perCategory: [{ category: "All", score: scorePct, correct, total }],
            },
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to submit initial assessment.";
        return { success: false, message, data: null };
    }
}
