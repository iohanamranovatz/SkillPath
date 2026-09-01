import { FileText, Video, Dumbbell, GraduationCap, ArrowUpRight } from "lucide-react"
import {Card, CardContent, CardHeader, CardTitle} from "@/frontend/user/common/card";
import {Button} from "@/frontend/user/common/button";

type RecommendedResource = {
    id: number | string
    title: string
    type: string
    url: string
    reason: string
}

const typeIcon: Record<string, typeof FileText> = {
    article: FileText,
    video: Video,
    exercise: Dumbbell,
    course: GraduationCap,
}

// Prima litera mare pentru afisare (ex: "article" -> "Article")
function labelForType(type: string) {
    if (!type) return "Resource"
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

export function RecommendedResources({ resources = [] }: { resources?: RecommendedResource[] }) {
    return (
        <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recommended for you</CardTitle>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Browse library
                </Button>
            </CardHeader>
            <CardContent className="grid gap-3">
                {resources.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        No recommendations yet. Take a test to get personalized resources.
                    </p>
                ) : (
                    resources.map((resource) => {
                    const Icon = typeIcon[(resource.type || "").toLowerCase()] ?? FileText
                    return (
                        <a
                            key={resource.id}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-4 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
                        >
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                                <Icon className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{resource.title}</p>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{labelForType(resource.type)}</span>
                                    <span aria-hidden>·</span>
                                    <span className="text-primary">{resource.reason}</span>
                                </div>
                            </div>
                            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                        </a>
                    )
                })
                )}
            </CardContent>
        </Card>
    )
}
