import { Category} from "@/frontend/admin/lib/types";
import { Dumbbell } from 'lucide-react';

interface CategoryCardProps {
    category: Category;
    onClick?: () => void;
}

export function CategoryCard({ category, onClick }: CategoryCardProps) {
    const iconSymbol = category.name.split(' ')[0].substring(0, 4);

    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            className="bg-card rounded-2xl border border-white/10 p-6 shadow-lg transition-all duration-300 ease-out flex flex-col justify-between h-full hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.3)] cursor-pointer group focus:outline-none"
        >
            {/* Top Section: Icon & Tag */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    {/* Icon Badge Box */}
                    <div className="w-12 h-12 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                        {iconSymbol}
                    </div>

                    {/* Tag Pill */}
                    {category.tags && (
                        <span className="table-badge badge-category">
                            {category.tags}
                        </span>
                    )}
                </div>

                {/* Title & Stats */}
                <div>
                    <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-blue-400 transition-colors">
                        {category.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Dumbbell className="w-4 h-4 text-muted-foreground/70" />
                        <span>{category.exerciseCount} exercises</span>
                    </div>
                </div>
            </div>
        </div>
    );
}