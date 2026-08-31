"use client";


import {AddUserModalProps} from "@/frontend/admin/lib/types";
import {useState} from "react";
import {AddUser} from "@/backend/admin/addUser";

export default function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps){
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        const formData = new FormData(e.currentTarget);
        const result = await AddUser(formData);

        if (result.success && result.user) {
            onUserAdded(result.user);
            onClose();
        } else {
            setErrorMsg("Error: " + result.message);
        }
        setLoading(false);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-6 shadow-2xl text-foreground">
                <h2 className="text-xl font-bold mb-4">Add New User</h2>

                {errorMsg && (
                    <p className="mb-4 text-sm text-red-500 font-medium">{errorMsg}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Name</label>
                        <input
                            name="name"
                            required
                            placeholder="e.g. John Doe"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="alex.doe@example.com"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Role</label>
                        <select
                            name="role"
                            defaultValue="user"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Estimated Level</label>
                        <select
                            name="estimated_level"
                            defaultValue="JUNIOR"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="JUNIOR">JUNIOR</option>
                            <option value="MID">MID</option>
                            <option value="SENIOR">SENIOR</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-white/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                        >
                            {loading ? "Adding..." : "Save User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}