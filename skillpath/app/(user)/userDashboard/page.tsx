import { redirect } from 'next/navigation';

import { createClient } from "@/helper/supabase/server";
import { UserDashboardUI } from '@/frontend/user/dashboard/UserDashboardUI';
import {fetchAllResourcesWrapper} from "@/backend/categories";
import {getCompletedTests, getTests} from '@/backend/user/getTests';
import { getDashboardData } from '@/backend/user/getDashboardData';
import { getInitialAssessmentOnboardingState } from "@/backend/user/assessments/initial/initialAssessmentLifecycle";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage(){
    const supabase = await createClient();

    const { data } = await supabase.auth.getUser();
    // check that a user is logged in, so the page cannot be accessed if
    // no logged-in user
    if(!data.user)
            redirect('/');

    const { data: userData, error } = await supabase
        .from('users')
        .select('id, email,name,role,estimated_level,user_interests ( category_id, categories ( name ) )' )
        .eq("auth_key", data.user.id)
        .single();

    // any non-admin account is treated as a user (student)
    if (error || !userData || userData.role === 'admin') {
        redirect('/');
    }
    const { data: objectives } = await supabase
        .from("user_objectives")
        .select("*")
        .eq("user_id", userData.id);

    const { data: userInterests } = await supabase
        .from("user_interests")
        .select("category_id")
        .eq("user_id", userData.id);

    const userInterestTagIds = userInterests?.map(
        (item) => item.category_id
    ) || [];

    const { data: allTags } = await supabase
        .from("categories")
        .select("id, name");

    const userAssessments = await getCompletedTests(userData.id);

    if (!userAssessments.success) {
        console.error("Error fetching assessments:", userAssessments.message);
    }

    // Extract just the IDs into a simple array [1, 2, 3...]
    const assessmentIds = userAssessments?.data.map(a => a.id) || [];

    // 2. Fetch only the correct answers that belong to those assessments
    const { data: correctAnswers, error: errorQ } = await supabase
        .from('assessment_answers')
        .select('id')
        .in('assessment_id', assessmentIds) // Match against the user's assessments
        .eq('is_correct', true);

    if (errorQ) {
        console.error("Error fetching correct answers:", errorQ.message);
    }

    const totalCorrectAnswers = correctAnswers?.length || 0;

    const initialResources = await fetchAllResourcesWrapper();

    const testsRes = await getTests(userData.id);

    const dashboardData = await getDashboardData(userData.id);
    const initialOnboardingState = await getInitialAssessmentOnboardingState(userData.id);

    return (
        <main>
            <UserDashboardUI
                tests={testsRes.data}
                initialData={userData}
                objectives={objectives || []}
                userInterestTagIds={userInterestTagIds}
                allTags={allTags || []}
                initialResources={initialResources}
                questions={totalCorrectAnswers}
                dashboardData={dashboardData}
                initialOnboardingState={initialOnboardingState}
            />
        </main>
    );
}

