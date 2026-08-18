export default function AdminHeader() {
    return (
        <header className="flex h-16 items-center justify-between border-b border-sidebar-border bg-sidebar px-8 text-sidebar-foreground">
            <div>
                <p className="text-sm text-muted-foreground">
                    Admin Dashboard
                </p>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground">
                    A
                </div>

                <div className="hidden sm:block">
                    <p className="text-sm font-medium text-sidebar-foreground">
                        Administrator
                    </p>
                </div>
            </div>
        </header>
    );
}