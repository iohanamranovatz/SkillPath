import { CategoriesManager } from "@/frontend/admin/Categories/CategoriesManager";
import AdminSidebar from "@/frontend/admin/components/Sidebar";
import AdminHeader from "@/frontend/admin/components/Header";
import AdminFooter from "@/frontend/admin/components/Footer";

export default function CategoriesPage() {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AdminSidebar />
            <div className="flex flex-1 flex-col">
                <AdminHeader />
                <main className="flex-1 bg-background p-8 text-foreground">
                    <CategoriesManager />
                </main>
                <AdminFooter />
            </div>
        </div>
    );
}
