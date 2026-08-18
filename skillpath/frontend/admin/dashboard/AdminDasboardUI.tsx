import AdminHeader from "@/frontend/admin/components/Header";
import AdminSidebar from "@/frontend/admin/components/Sidebar";
import Dashboard from "@/frontend/admin/components/Dashboard";
import AdminFooter from "@/frontend/admin/components/Footer";
import { getDashboardData } from "@/frontend/admin/lib/mock-data";

export function AdminDashboardUI() {
    const { stats, assessmentActivity, topUsers, weakestCategories } = getDashboardData();

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />

            <div className="flex flex-1 flex-col">
                <AdminHeader />

                <Dashboard
                    stats={stats}
                    assessmentActivity={assessmentActivity}
                    topUsers={topUsers}
                    weakestCategories={weakestCategories}
                />

                <AdminFooter />
            </div>
        </div>
    );
}

export default function AdminPage() {
    return <AdminDashboardUI />;
}