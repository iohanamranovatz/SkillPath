import { redirect } from 'next/navigation';

import {supabase} from '@/helper/SupabaseClient';

import { UserDashboardUI } from '@/frontend/user/dashboard/UserDashboardUI';

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

    const currentInterestName = userData?.user_interests?.[0]?.tags?.[0]?.name || '';

    const initialData = {
        id: userData?.id || 0,
        email: userData?.email || "",
        name: userData?.name || "",
        role: userData?.role || "User",
        estimated_level: userData?.estimated_level || "Beginner",
        current_objective: "",
        current_interest: currentInterestName,
    }

    return (
            <main>
                <UserDashboardUI initialData={initialData}></UserDashboardUI>
        </main>
    );
}

