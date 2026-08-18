import { FileText, Video, Dumbbell, GraduationCap, Clock, ArrowUpRight } from "lucide-react"
import {recommendedResources, ResourceType} from "@/frontend/user/lib/mock-data";
import {Card, CardContent, CardHeader, CardTitle} from "@/frontend/user/common/card";
import {Button} from "@/frontend/user/common/button";


const typeIcon: Record<ResourceType, typeof FileText> = {
    Article: FileText,
    Video: Video,
    Exercise: Dumbbell,
    Course: GraduationCap,
}

export function RecommendedResources() {
    return (
        <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recommended for you</CardTitle>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Browse library
                </Button>
            </CardHeader>
            <CardContent className="grid gap-3">
                {recommendedResources.map((resource) => {
                    const Icon = typeIcon[resource.type as ResourceType]
                    return (
                        <button
                            key={resource.id}
                            className="group flex items-center gap-4 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
                        >
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                                <Icon className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{resource.title}</p>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{resource.type}</span>
                                    <span aria-hidden>·</span>
                                    <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                                        {resource.minutes} min
                  </span>
                                    <span aria-hidden>·</span>
                                    <span className="text-primary">{resource.reason}</span>
                                </div>
                            </div>
                            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                        </button>
                    )
                })}
            </CardContent>
        </Card>
    )
}
