import AdminHeader from "@/frontend/admin/components/Header";
import AdminSidebar from "@/frontend/admin/components/Sidebar";
import Dashboard from "@/frontend/admin/components/Dashboard";
import AdminFooter from "@/frontend/admin/components/Footer";

export default function AdminPage() {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />

            <div className="flex flex-1 flex-col">
                <AdminHeader />

                <Dashboard />

                <AdminFooter />
            </div>
        </div>
    );
}