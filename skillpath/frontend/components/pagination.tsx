import {PaginationProps} from "@/frontend/lib/types";

export default function Pagination({
     currentPage,
     totalPages,
     totalItems,
     itemsPerPage,
     onPageChange,
}: PaginationProps) {
    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/10 pt-4 px-2 gap-3">
            <span className="text-xs text-muted-foreground">
            Showing {startItem} to {endItem} of {totalItems} items
            </span>

            <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                    >
                        Previous
                    </button>

                    <span className="text-xs text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        type="button"
                        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                    >
                        Next
                    </button>
                </div>
        </div>
    );
}