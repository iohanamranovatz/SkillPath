
import { redirect } from 'next/navigation';

import { createClient } from "@/helper/supabase/server";
import { AdminDashboardUI } from '@/frontend/admin/dashboard/AdminDasboardUI';

export default async function DashboardPage(){
    const supabase = await createClient();

    const { data } = await supabase.auth.getUser();
    // check that a user is logged in, so the page cannot be accessed if 
    // no logged-in user
    if(!data.user)
            redirect('/');
    
    
    return (
            <main>
                <AdminDashboardUI></AdminDashboardUI>
            </main>
    );
}

