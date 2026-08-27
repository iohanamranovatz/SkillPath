"use server";

import {supabase} from "@/helper/SupabaseClient";

export async function getTests(userId:number){

    const {data, error} = await supabase.from("assessments").select('id,status,score_total,started_at,completed_at,assessment_answers ( questions ( difficulty, categories (name) ) )').eq("user_id",userId).order("started_at", {ascending : false });
    
    if(error)
        return { succes:false, message: error.message, data : [] };

    const tests= ( data ?? []).map((a:any) => {
        const answers=a.assessment_answers ?? [];
        //folosim raspunsurile ca o punte spre categoria din care face parte testul
        const categories = Array.from(new Set ( answers.map((ans:any) => ans.questions?.categories?.name).filter(Boolean) )) as string[];
    

    return {
        id:a.id,categories,
        questions:answers.length,
        score : a.status == "completed" ? a.score_total : null,
        status:a.status,
        startedAt : a.started_at,
        completedAt : a.completed_at,    
    }
    });  

    return {succes:true, data:tests}

}