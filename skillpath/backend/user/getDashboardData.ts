"use server";

import { supabase } from "@/helper/SupabaseClient";
import {getCompletedTests} from "@/backend/user/getTests";

export interface SkillPoint {
    skill: string;
    score: number;
}

export interface ScorePoint {
    month: string;
    score: number;
}

export interface RecentResult {
    id: number;
    title: string;
    topic: string;
    difficulty: "Easy" | "Medium" | "Hard";
    score: number;
    date: string;
}

export interface RecommendedResource {
    id: number;
    title: string;
    type: string;
    url: string;
    reason: string;
}

export interface DashboardData {
    skills: SkillPoint[];
    scoreHistory: ScorePoint[];
    recentResults: RecentResult[];
    recommendedResources: RecommendedResource[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Normalizam dificultatea din DB (EASY/MEDIUM/HARD) in formatul componentelor (Easy/Medium/Hard)
function normalizeDifficulty(raw: string | null | undefined): "Easy" | "Medium" | "Hard" {
    switch ((raw || "").toUpperCase()) {
        case "HARD":
            return "Hard";
        case "EASY":
            return "Easy";
        default:
            return "Medium";
    }
}

// Returneaza cheia care apare cel mai des intr-o lista (ex: categoria / dificultatea dominanta a unui test)
function mostFrequent<T extends string | number>(items: T[]): T | null {
    if (items.length === 0) return null;
    const counts = new Map<T, number>();
    let best = items[0];
    let bestCount = 0;
    for (const item of items) {
        const next = (counts.get(item) || 0) + 1;
        counts.set(item, next);
        if (next > bestCount) {
            bestCount = next;
            best = item;
        }
    }
    return best;
}

export async function getDashboardData(userId: number): Promise<DashboardData> {
    const empty: DashboardData = {
        skills: [],
        scoreHistory: [],
        recentResults: [],
        recommendedResources: [],
    };

    // // 1. Toate testele completate ale userului, cronologic
    // const { data: assessments } = await supabase
    //     .from("assessments")
    //     .select("id, score_total, completed_at")
    //     .eq("user_id", userId)
    //     .eq("status", "completed")
    //     .order("completed_at", { ascending: true });
    //

    const assessments = await getCompletedTests(userId);
    const regularTests = assessments.data.filter((test: any) => !test.isInitial);

    if (!assessments || assessments.data.length === 0) {
        return empty;
    }

    const assessmentIds = regularTests.map((a) => a.id);

    // 2. Toate raspunsurile din aceste teste, cu categorie + dificultate
    const { data: answers } = await supabase
        .from("assessment_answers")
        .select(`
            assessment_id,
            is_correct,
            questions!inner (
                difficulty,
                category_id,
                categories ( id, name )
            )
        `)
        .in("assessment_id", assessmentIds);

    const rows = (answers || []) as any[];

    // 3. SKILL RADAR — procent de raspunsuri corecte pe fiecare categorie (cumulat)
    const categoryStats: Record<number, { name: string; total: number; correct: number }> = {};
    // Grupam si per-test pentru RecentResults (categoria/dificultatea dominanta a fiecarui test)
    const perAssessment: Record<number, { categories: string[]; difficulties: string[] }> = {};

    for (const ans of rows) {
        const q = ans.questions;
        if (!q || !q.categories) continue;

        const catId = q.category_id as number;
        const catName = q.categories.name as string;

        if (!categoryStats[catId]) {
            categoryStats[catId] = { name: catName, total: 0, correct: 0 };
        }
        categoryStats[catId].total += 1;
        if (ans.is_correct) categoryStats[catId].correct += 1;

        if (!perAssessment[ans.assessment_id]) {
            perAssessment[ans.assessment_id] = { categories: [], difficulties: [] };
        }
        perAssessment[ans.assessment_id].categories.push(catName);
        perAssessment[ans.assessment_id].difficulties.push(q.difficulty);
    }

    const skills: SkillPoint[] = Object.values(categoryStats).map((stat) => ({
        skill: stat.name,
        score: Math.round((stat.correct / stat.total) * 100),
    }));

    const weakCategoryIds: number[] = Object.entries(categoryStats)
        .filter(([, stat]) => Math.round((stat.correct / stat.total) * 100) < 60)
        .map(([id]) => Number(id));

    // 4. SCORE CHART — media score_total grupata pe luna
    const monthBuckets: Record<string, { label: string; sum: number; count: number }> = {};
    for (const a of regularTests) {
        if (a.completedAt == null || a.score == null) continue;
        const d = new Date(a.completedAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthBuckets[key]) {
            monthBuckets[key] = { label: MONTHS[d.getMonth()], sum: 0, count: 0 };
        }
        monthBuckets[key].sum += a.score;
        monthBuckets[key].count += 1;
    }

    const scoreHistory: ScorePoint[] = Object.entries(monthBuckets)
        .sort(([a], [b]) => {
            const [ay, am] = a.split("-").map(Number);
            const [by, bm] = b.split("-").map(Number);
            return ay === by ? am - bm : ay - by;
        })
        .slice(-6)
        .map(([, bucket]) => ({
            month: bucket.label,
            score: Math.round(bucket.sum / bucket.count),
        }));

    // 5. RECENT RESULTS — ultimele 5 teste completate
    const recentResults: RecentResult[] = [...regularTests]
        .filter((a) => a.completedAt != null)
        .sort((x, y) => new Date(y.completedAt).getTime() - new Date(x.completedAt).getTime())
        .slice(0, 5)
        .map((a) => {
            const agg = perAssessment[a.id] || { categories: [], difficulties: [] };
            const topic = mostFrequent(agg.categories) || "General";
            const difficulty = normalizeDifficulty(mostFrequent(agg.difficulties) as string);
            const d = new Date(a.completedAt);
            return {
                id: a.id,
                title: topic,
                topic,
                difficulty,
                score: a.score ?? 0,
                date: `${MONTHS[d.getMonth()]} ${d.getDate()}`,
            };
        });

    // 6. RECOMMENDED RESOURCES — resurse pentru categoriile slabe (<60%)
    let recommendedResources: RecommendedResource[] = [];
    if (weakCategoryIds.length > 0) {
        const { data: resources } = await supabase
            .from("learning_resources")
            .select("id, title, url, type, category_id")
            .in("category_id", weakCategoryIds)
            .limit(6);

        recommendedResources = (resources || []).map((res) => ({
            id: res.id,
            title: res.title,
            type: res.type,
            url: res.url,
            reason: "Boost your weakest area",
        }));
    }

    return { skills, scoreHistory, recentResults, recommendedResources };
}
