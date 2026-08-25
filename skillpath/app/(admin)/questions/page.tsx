// page.tsx
import { getQuestions } from "@/backend/admin/actions/questions"
import QuestionBankClient from "./client";

export const dynamic = "force-dynamic"; // Tells Next.js not to cache this page statically

export default async function QuestionBankPage() {
    const response = await getQuestions();

    // Fallback to an empty array if the fetch fails
    const questions = response.success && response.data ? response.data : [];

    return <QuestionBankClient initialQuestions={questions} />;
}