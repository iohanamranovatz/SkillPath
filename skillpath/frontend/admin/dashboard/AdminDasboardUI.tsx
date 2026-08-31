import Dashboard from "@/frontend/admin/components/Dashboard";
import { getAdminDashboardData } from "@/backend/admin/getAdminDashboardData";

export async function AdminDashboardUI() {
    const { stats, assessmentActivity, topUsers, weakestCategories } = await getAdminDashboardData();

    return (
        <Dashboard
            stats={stats}
            assessmentActivity={assessmentActivity}
            topUsers={topUsers}
            weakestCategories={weakestCategories}
        />
    );
}

export default function AdminPage() {
    return <AdminDashboardUI />;
}