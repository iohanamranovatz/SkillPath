import { redirect } from 'next/navigation';

import {supabase} from '@/helper/SupabaseClient';

import { UserDashboardUI } from '@/frontend/user/dashboard/UserDashboardUI';
import {fetchAllResourcesWrapper} from "@/backend/categories";

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
        .select('id, email,name,role,estimated_level,user_interests ( tag_id, tags ( name ) )' )
        .eq("auth_key", data.user.id)
        .single();

    if (error || !userData) {
        return { error: 'User extracting data from database.' };
    }

    const { data: objectives } = await supabase
        .from("user_objectives")
        .select("*")
        .eq("user_id", userData.id);

    const { data: userInterests } = await supabase
        .from("user_interests")
        .select("tag_id")
        .eq("user_id", userData.id);

    const userInterestTagIds = userInterests?.map(
        (item) => item.tag_id
    ) || [];

    const { data: allTags } = await supabase
        .from("tags")
        .select("id, name");

    const initialResources = await fetchAllResourcesWrapper();

    return (
            <main>
                <UserDashboardUI
                    initialData={userData}
                    objectives={objectives || []}
                    userInterestTagIds={userInterestTagIds}
                    allTags={allTags || []}
                    initialResources={initialResources}
                ></UserDashboardUI>
        </main>
    );
}

