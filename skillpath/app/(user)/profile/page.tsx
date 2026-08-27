import supabase from "@/helper/SupabaseClient";
import {ProfileView} from "@/frontend/user/components/profile-view";
import {redirect} from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
        redirect('/');
    }

    const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("auth_key", authData.user.id)
        .single();

    if (!user)
        return <div>User not found!</div>

    const { data: objectives } = await supabase
        .from("user_objectives")
        .select("*")
        .eq("user_id", user.id);

    const { data: userInterests } = await supabase
        .from("user_interests")
        .select("tag_id")
        .eq("user_id", user.id);

    const userInterestTagIds = userInterests
        ?.map(
            (interest) => interest.tag_id
        ) || [];

    const { data: allTags } = await supabase
        .from("tags")
        .select("id, name");

    return (
        <ProfileView
            initialData={user}
            objectives={objectives || []}
            userInterestTagIds={userInterestTagIds}
            allTags={allTags || []}
        />
    );
}