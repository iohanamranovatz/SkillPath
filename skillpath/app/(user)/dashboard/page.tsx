
import { redirect } from 'next/navigation';

import {supabase} from '@/helper/SupabaseClient';

import { UserDashboardUI } from '@/frontend/user/dashboard/UserDashboardUI';

export default async function DashboardPage(){
   
    const { data } = await supabase.auth.getUser();
    //verificam daca avem un user logat a.i nu poate fi accesata pagina daca 
    //nu este user logat
    if(!data.user)
            redirect('/');
    
    
    return (
            <main>
                <UserDashboardUI></UserDashboardUI>
        </main>
    );
}

