import { BrainCircuit, Code2, LineChart, ChevronRight } from "lucide-react"
import { PageHeading } from "./page-heading"
import { Card } from "@/frontend/user/common/card"
import { learningResources } from "@/frontend/user/lib/mock-data"

const iconMap = {
    BrainCircuit,
    Code2,
    LineChart,
} as const

export function ResourcesView() {
    return (
        <div className="space-y-6">
            <PageHeading
                title="Resources"
                description="Curated material to help you level up your development skills."
            />

            <div className="grid gap-4 lg:grid-cols-2">
                {learningResources.map((resource) => {
                    const Icon = iconMap[resource.icon]
                    return (
                        <Card key={resource.id} className="flex gap-5 p-6">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary">
                                <Icon className="size-[23px]" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                                        {resource.type}
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                        {resource.tag}
                                    </span>
                                </div>
                                <h2 className="text-lg font-semibold">{resource.title}</h2>
                                <p className="text-sm text-muted-foreground">{resource.detail}</p>
                                <button className="flex items-center gap-1 text-sm font-medium text-primary">
                                    Open resource <ChevronRight className="size-4" />
                                </button>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
