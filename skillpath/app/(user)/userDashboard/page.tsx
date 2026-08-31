import { redirect } from 'next/navigation';

import {supabase} from '@/helper/SupabaseClient';

import { UserDashboardUI } from '@/frontend/user/dashboard/UserDashboardUI';
import {fetchAllResourcesWrapper} from "@/backend/categories";
import { getTests } from '@/backend/user/getTests';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage(){

    const { data } = await supabase.auth.getUser();
    //verificam daca avem un user logat a.i nu poate fi accesata pagina daca
    //nu este user logat
    if(!data.user)
            redirect('/');

    const { data: userData, error } = await supabase
        .from('users')
        .select('id, email,name,role,estimated_level,user_interests ( category_id, categories ( name ) )' )
        .eq("auth_key", data.user.id)
        .single();


    if (error || !userData || userData.role !== 'user') {
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
        .from("tags")
        .select("id, name");

    const { data: userAssessments, error: assessmentErr } = await supabase
        .from('assessments')
        .select('id')
        .eq('user_id', userData.id);

    if (assessmentErr) {
        console.error("Error fetching assessments:", assessmentErr.message);
    }

    // Extract just the IDs into a simple array [1, 2, 3...]
    const assessmentIds = userAssessments?.map(a => a.id) || [];

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
            />
        </main>
    );
}


