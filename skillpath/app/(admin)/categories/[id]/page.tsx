import {
    getCategoryById,
    getQuestionsByCategory, getResourcesFromCategory,
} from "@/backend/categories";
import { AddResourceForm } from "@/frontend/admin/Categories/AddResourceForm";

export default async function CategoryDetailPage({
    params,
}: {
    params: Promise<{ id: string }>; // în Next 16 params e un Promise
}) {
    const { id } = await params;

    const [cat, resources, questions] = await Promise.all([
        getCategoryById(id),
        getResourcesFromCategory(id),
        getQuestionsByCategory(id),
    ]);

    if (!cat.success || !cat.data) {
        return (
            <p className="text-muted-foreground">Category not found.</p>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{cat.data.name}</h1>
                {cat.data.description && (
                    <p className="text-sm text-muted-foreground mt-1">{cat.data.description}</p>
                )}
            </div>

            {/* RESURSE */}
            <section className="bg-card rounded-2xl border border-white/10 p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-3">Learning Resources</h2>

                <AddResourceForm categoryId={Number(id)} />

                {resources.data.length > 0 ? (
                    <ul className="divide-y divide-white/10">
                        {resources.data.map((r: any) => (
                            <li key={r.id} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="font-medium">{r.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {r.type}
                                    </p>
                                </div>
                                {r.url && (
                                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                                       className="text-sm text-blue-400 hover:underline">
                                        Open ↗
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No resources available yet.</p>
                )}
            </section>

            {/* ÎNTREBĂRI */}
            <section className="bg-card rounded-2xl border border-white/10 p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-3">
                    Questions ({questions.data.length})
                </h2>
                {questions.data.length > 0 ? (
                    <ul className="divide-y divide-white/10">
                        {questions.data.map((q: any) => (
                            <li key={q.id} className="flex items-center justify-between py-3">
                                <span className="font-medium">{q.question_text}</span>
                                <span className="table-badge badge-category">{q.difficulty}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No questions belong to this category.</p>
                )}
            </section>
        </div>
    );
}
