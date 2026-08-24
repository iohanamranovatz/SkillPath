import { Flame } from "lucide-react"
import { PageHeading } from "./page-heading"
import { Card } from "@/frontend/user/common/card"
import { Button } from "@/frontend/user/common/button"
import { user } from "@/frontend/user/lib/mock-data"
import {useState} from "react";
import {updateProfile} from "@/backend/user/updateProfile";

interface UserProfileData {
    id: number;
    email: string;
    name: string;
    role: string;
    estimated_level: string;
    current_objective: string;
    current_interest: string;
}

interface ProfileViewProps {
    initialData: UserProfileData;
}

export function ProfileView({ initialData }: ProfileViewProps) {
    const [message, setMessage] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setMessage(null);
        const response = await updateProfile(formData);
        setMessage(response.message);
    }

    return (
        <div className="space-y-6">
            <PageHeading
                title="Profile"
                description="Manage your learning identity and preferences."
            />

            <Card className="max-w-3xl space-y-7 p-7" >
                <form action={handleSubmit} className="space-y-7">
                    <div className="flex flex-wrap items-center gap-5 border-b border-border pb-7">
                        <div className="flex size-20 items-center justify-center rounded-full bg-primary/20 text-2xl font-semibold text-primary">
                            {(initialData?.name || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">{initialData?.name}</h2>
                            <p className="text-sm text-muted-foreground">
                                {initialData?.role} · {initialData?.email}
                            </p>
                            <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                                <Flame className="size-4" />
                                {user.streak} day learning streak
                            </div>
                        </div>
                    </div>

                    {message && (
                        <p className="text-sm font-medium text-primary">
                            {message}
                        </p>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="space-y-2 text-sm text-muted-foreground">
                            Full name
                            <input
                                name="fullName"
                                className="block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring"
                                defaultValue={initialData?.name || "U"}
                            />
                        </label>

                        <label className="space-y-2 text-sm text-muted-foreground">
                            Role
                            <input
                                className="block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring"
                                defaultValue={initialData?.role || "Beginner"}
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
                            <select
                                name="interestTagName"
                                className="block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring"
                                defaultValue={initialData?.current_interest || "react"}
                            >
                                <option>Algorithms</option>
                                <option>Frontend</option>
                                <option>Backend</option>
                            </select>
                        </label>
                    </div>

                    <Button type="submit">Save changes</Button>
                </form>
            </Card>
        </div>
    )
}
