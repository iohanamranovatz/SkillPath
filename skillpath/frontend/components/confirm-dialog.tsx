"use client";

import { ReactNode } from "react";

interface Props {
    open: boolean;
    title: string;
    /** Explanatory text; may contain markup (e.g. a highlighted name). */
    message: ReactNode;
    /** Error message shown inside the dialog; the dialog stays open while it is set. */
    error?: string;
    /** While the action is in progress the confirm button is disabled. */
    busy?: boolean;
    confirmLabel?: string;
    busyLabel?: string;
    cancelLabel?: string;
    /** "danger" = red button (deletions), "default" = blue (everything else). */
    tone?: "danger" | "default";
    onConfirm: () => void;
    onCancel: () => void;
}

// App-styled confirmation dialog, used instead of the native confirm().
export default function ConfirmDialog({
    open,
    title,
    message,
    error,
    busy = false,
    confirmLabel = "Confirm",
    busyLabel = "Working…",
    cancelLabel = "Cancel",
    tone = "danger",
    onConfirm,
    onCancel,
}: Props) {
    if (!open) return null;

    const confirmClass =
        tone === "danger"
            ? "bg-red-600 hover:bg-red-500"
            : "bg-blue-600 hover:bg-blue-500";

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onCancel}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-card rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4"
            >
                <h2 className="text-lg font-semibold">{title}</h2>
                <div className="text-sm text-muted-foreground">{message}</div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-10 rounded-lg border border-white/10 px-4 text-sm hover:bg-white/5"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className={`h-10 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-50 ${confirmClass}`}
                    >
                        {busy ? busyLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
