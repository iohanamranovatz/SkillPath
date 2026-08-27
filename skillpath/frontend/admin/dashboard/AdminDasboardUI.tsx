import Dashboard from "@/frontend/admin/components/Dashboard";
import { getDashboardData } from "@/frontend/admin/lib/mock-data";

export function AdminDashboardUI() {
    const { stats, assessmentActivity, topUsers, weakestCategories } = getDashboardData();

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