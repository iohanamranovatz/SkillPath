
import { redirect } from 'next/navigation';

import { createClient } from "@/helper/supabase/server";
import { AdminDashboardUI } from '@/frontend/admin/dashboard/AdminDasboardUI';

export default async function DashboardPage(){
    const supabase = await createClient();

    const { data } = await supabase.auth.getUser();
    //verificam daca avem un user logat a.i nu poate fi accesata pagina daca 
    //nu este user logat
    if(!data.user)
            redirect('/');
    
    
    return (
            <main>
                <AdminDashboardUI></AdminDashboardUI>
            </main>
    );
}

