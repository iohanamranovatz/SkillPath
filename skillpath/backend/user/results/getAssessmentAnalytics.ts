"use server"

import { createClient } from "@/helper/supabase/server";

export async function getAssessmentAnalytics(assessmentId: number) {
    const supabase = await createClient();

    // iau raspunsurile salvate impreuna cu tag-ul intrebarii
    // !inner = inner join
    const { data: answers, error } = await supabase
        .from("assessment_answers")
        .select(`
            is_correct,
            questions!inner (
                tag_id,
                tags (
                id,
                name
                )
            )
        `)
        .eq('assessment_id', assessmentId);

    if (error || !answers) return { success: false, message: error?.message };

    /**
     STRUCTURA pentru calculul pe tag-uri
     Record = dictionar (cheie - valoare)
     cheia: number ( id-ul tag-ului )
     valoarea: { name, total, correct }
     **/
    const tagStats: Record<number, { name: string, total: number, correct: number }> = {};

    answers.forEach((ans: any) => {
       // verificam daca intrebarea si tag-ul exista
       const question = ans.questions;

       // datorita raspunsurilor luate din supabase de mai sus - rand 8
       // .questions este generat din ans.questions (relatia question_id)
        // .tags este generat din question.tags (relatia tag_id -> tabela tags)

       if (!question || !question.tags) return;

       const tagId = question.tag_id;
       const tagName = question.tags.name;

       if (!tagStats[tagId]) {
           tagStats[tagId] = { name: tagName, total: 0, correct: 0 };
       }

       tagStats[tagId].total += 1;

       if (ans.is_correct) {
           tagStats[tagId].correct += 1;
       }
    });

    // identific Weak Areas -> scorul pe tag este < 60%
    const weakTagIds: number[] = [];

    // tablou de obiecte cu detalii trimis catre front pt a fi afisat
    const weakAreasList: { id: number; name: string; percentage: number }[] = [];

    Object.entries(tagStats).forEach(([tagIdStr, stat]) => {
        const tagId = Number(tagIdStr);
        const percentage = Math.round((stat.correct / stat.total) * 100);

        if (percentage < 60) {
            weakTagIds.push(tagId);
            weakAreasList.push({
                id: tagId,
                name: stat.name,
                percentage
            });
        }
    });

    // preiau resursele recomandate din BD pentru tag-urile slabe
    let recommendedResources = [];

    if (weakTagIds.length > 0) {
        const { data: resources } = await supabase
            .from("learning_resources")
            .select("*")
            .in('tag_id', weakTagIds);

        recommendedResources = resources || [];
    }

    return {
        weakAreas: weakAreasList,
        recommendedResources
    };
}

export async function getLatestAssessmentAnalytics() {
    const supabase = await createClient();

    // preiau sesiunea utilizatorului logat direct din Supabase
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { weakAreas: [], recommendedResources: [], stats: null };
    }

    // gasesc ultimul test completat al acestui utilizator
    const { data: latestAssessment } = await supabase
        .from('assessments')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

    // daca nu are niciun test completat, returnam date goale
    if (!latestAssessment) {
        return { weakAreas: [], recommendedResources: [], stats: null };
    }

    // 3. Rulăm codul tău existent folosind ID-ul găsit
    return await getAssessmentAnalytics(latestAssessment.id);
}