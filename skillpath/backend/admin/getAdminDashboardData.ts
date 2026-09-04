"use server";

import { createClient } from "@/helper/supabase/server";
import type {
    DashboardData,
    DashboardStat,
    AssessmentActivityItem,
    TopUser,
    WeakCategory,
} from "@/frontend/admin/lib/mock-data";

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function getAdminDashboardData(): Promise<DashboardData> {
    const supabase = await createClient();

    // Rulam interogarile in paralel
    const [usersRes, assessmentsRes, questionsRes, categoriesRes, answersRes] = await Promise.all([
        supabase.from("users").select("id, name, email, role"),
        supabase.from("assessments").select("id, user_id, status, completed_at"),
        supabase.from("questions").select("id, is_active"),
        supabase.from("categories").select("id, name"),
        supabase
            .from("assessment_answers")
            .select("is_correct, questions!inner ( category_id, categories ( id, name ) )"),
    ]);

    const users = (usersRes.data || []) as any[];
    const assessments = (assessmentsRes.data || []) as any[];
    const questions = (questionsRes.data || []) as any[];
    const categories = (categoriesRes.data || []) as any[];
    const answers = (answersRes.data || []) as any[];

    // Doar studentii (orice nu e admin)
    const students = users.filter((u) => u.role !== "admin");
    const completed = assessments.filter((a) => a.status === "completed");

    // --- ASSESSMENT ACTIVITY: ultimele 7 zile (assessment-uri completate / zi) ---
    const today = new Date();
    const buckets: (AssessmentActivityItem & { key: string })[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        buckets.push({
            key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
            day: SHORT_DAYS[d.getDay()],
            fullDay: FULL_DAYS[d.getDay()],
            count: 0,
        });
    }
    for (const a of completed) {
        if (!a.completed_at) continue;
        const d = new Date(a.completed_at);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const bucket = buckets.find((b) => b.key === key);
        if (bucket) bucket.count += 1;
    }
    const assessmentActivity: AssessmentActivityItem[] = buckets.map(({ day, fullDay, count }) => ({
        day,
        fullDay,
        count,
    }));
    const assessmentsThisWeek = assessmentActivity.reduce((sum, b) => sum + b.count, 0);

    // --- TOP USERS: studenti dupa numar de assessment-uri completate ---
    const countByUser = new Map<number, number>();
    for (const a of completed) {
        countByUser.set(a.user_id, (countByUser.get(a.user_id) || 0) + 1);
    }
    const studentById = new Map<number, any>(students.map((s) => [s.id, s]));
    const topUsers: TopUser[] = [...countByUser.entries()]
        .filter(([userId]) => studentById.has(userId))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, count], index) => {
            const s = studentById.get(userId);
            return {
                id: String(userId),
                name: s?.name || "Unknown",
                email: s?.email || "",
                count,
                rank: index + 1,
            };
        });

    // --- WEAKEST CATEGORIES: rata de greseala pe categorie (incorect / total) ---
    const catStats: Record<number, { name: string; total: number; wrong: number }> = {};
    for (const ans of answers) {
        const q = ans.questions;
        if (!q || !q.categories) continue;
        const catId = q.category_id as number;
        const catName = q.categories.name as string;
        if (!catStats[catId]) catStats[catId] = { name: catName, total: 0, wrong: 0 };
        catStats[catId].total += 1;
        if (!ans.is_correct) catStats[catId].wrong += 1;
    }
    const weakestCategories: WeakCategory[] = Object.entries(catStats)
        .map(([id, stat]) => ({
            id: String(id),
            label: stat.name,
            percentage: Math.round((stat.wrong / stat.total) * 100),
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);

    // --- STAT CARDS ---
    const activeQuestions = questions.filter((q) => q.is_active === true).length;
    const categoriesInUse = new Set(Object.keys(catStats).map(Number)).size;
    const activeStudents = countByUser.size;

    const stats: DashboardStat[] = [
        {
            title: "Total Students",
            value: students.length,
            change: `${activeStudents} active`,
        },
        {
            title: "Assessments",
            value: completed.length,
            change: `+${assessmentsThisWeek} this week`,
        },
        {
            title: "Questions",
            value: questions.length,
            change: `${activeQuestions} active`,
        },
        {
            title: "Categories",
            value: categories.length,
            change: `${categoriesInUse} in use`,
        },
    ];

    return { stats, assessmentActivity, topUsers, weakestCategories };
}
