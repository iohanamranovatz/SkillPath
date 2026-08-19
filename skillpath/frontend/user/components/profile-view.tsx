import { Flame } from "lucide-react"
import { PageHeading } from "./page-heading"
import { Card } from "@/frontend/user/common/card"
import { Button } from "@/frontend/user/common/button"
import { user } from "@/frontend/user/lib/mock-data"

export function ProfileView() {
    return (
        <div className="space-y-6">
            <PageHeading
                title="Profile"
                description="Manage your learning identity and preferences."
            />

            <Card className="max-w-3xl space-y-7 p-7">
                <div className="flex flex-wrap items-center gap-5 border-b border-border pb-7">
                    <div className="flex size-20 items-center justify-center rounded-full bg-primary/20 text-2xl font-semibold text-primary">
                        {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">{user.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {user.role} · alex.rivera@example.com
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                            <Flame className="size-4" />
                            {user.streak} day learning streak
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <label className="space-y-2 text-sm text-muted-foreground">
                        Full name
                        <input
                            className="block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring"
                            defaultValue={user.name}
                            readOnly
                        />
                    </label>
                    <label className="space-y-2 text-sm text-muted-foreground">
                        Role
                        <input
                            className="block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring"
                            defaultValue={user.role}
                            readOnly
                        />
                    </label>
                    <label className="space-y-2 text-sm text-muted-foreground">
                        Experience level
                        <select className="block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring" defaultValue={user.level}>
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                        </select>
                    </label>
                    <label className="space-y-2 text-sm text-muted-foreground">
                        Focus area
                        <select className="block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring" defaultValue="Algorithms">
                            <option>Algorithms</option>
                            <option>Frontend</option>
                            <option>Backend</option>
                        </select>
                    </label>
                </div>

                <Button>Save changes</Button>
            </Card>
        </div>
    )
}
