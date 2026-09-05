import {Suspense} from "react";
import ResetPasswordForm from "@/frontend/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#101218]">
                <div className="w-8 h-8 border-4 border-[#6B72E1] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}