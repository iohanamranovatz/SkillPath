import { Search, Bell, Flame, LayoutDashboard } from "lucide-react"
import { user } from "@/frontend/user/lib/mock-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/frontend/user/common/avatar"

export function Topbar({ onMenuOpen }: { onMenuOpen: () => void }) {
    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <button
                className="flex items-center justify-center text-foreground lg:hidden"
                onClick={onMenuOpen}
                aria-label="Open menu"
            >
                <LayoutDashboard className="size-5" />
            </button>

            <div className="relative hidden max-w-sm flex-1 md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="search"
                    placeholder="Search tests, topics, resources..."
                    aria-label="Search"
                    className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
            </div>

            <div className="ml-auto flex items-center gap-3">
                <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium sm:flex">
                    <Flame className="size-4 text-primary" />
                    <span>{user.streak}</span>
                    <span className="hidden text-muted-foreground sm:inline">day streak</span>
                </div>

                <button
                    className="relative flex size-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Notifications"
                >
                    <Bell className="size-[18px]" />
                    <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
                </button>

                <div className="flex items-center gap-2">
                    <Avatar className="size-9">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="hidden leading-tight sm:block">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                    </div>
                </div>
            </div>
        </header>
    )
}
