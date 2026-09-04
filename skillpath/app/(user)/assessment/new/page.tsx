import { redirect } from "next/navigation";
import { createClient } from "@/helper/supabase/server";
import { NewTestForm } from "@/frontend/user/components/new-test-form";
import { getInitialAssessmentOnboardingState } from "@/backend/user/assessments/initial/initialAssessmentLifecycle";

export default async function NewTestPage() {
    const supabase = await createClient();

    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/");

    // auth.getUser() gives the uuid; take the bigint id + the user level
    const { data: dbUser } = await supabase
        .from("users")
        .select("id, estimated_level")
        .eq("auth_key", data.user.id)
        .single();

    if (!dbUser) redirect("/");

    const onboardingState = await getInitialAssessmentOnboardingState(dbUser.id);
    if (onboardingState.requiresInitialAssessment) {
        if (onboardingState.activeInitialAssessmentId) {
            redirect(`/assessment/${onboardingState.activeInitialAssessmentId}`);
        }
        redirect("/userDashboard");
    }

    // the user level (new users -> Beginner)
    const userLevel = (dbUser.estimated_level ?? "Beginner").toLowerCase();

    // show ONLY the categories matching the user level (categories.difficulty == their level)
    const { data: allCategories } = await supabase
        .from("categories")
        .select("id, name, difficulty");

    const categories = (allCategories ?? []).filter(
        (c: { difficulty: string | null }) => (c.difficulty ?? "").toLowerCase() === userLevel
    );

    return (
        <main className="mx-auto max-w-2xl p-4 md:p-6">
            <NewTestForm userId={dbUser.id} categories={categories} userLevel={dbUser.estimated_level ?? "Beginner"} />
        </main>
    );
}
