export interface Objective {
    id: number;
    title: string;
    is_completed: boolean;
}

export interface Tag {
    id: number;
    name: string;
}

export interface UserProfileData {
    id: number;
    email: string;
    name: string;
    role: string;
    estimated_level: string;
}

export interface ProfileViewProps {
    initialData: UserProfileData;
    objectives: Objective[];
    userInterestTagIds: number[]; // ID-urile tag-urilor selectate de user
    allTags: Tag[]; // Toate tag-urile disponibile din tabela tags
}

export interface Resource {

    id: number;
    category: string;
    title: string;
    url: string;
    type: string;
}

export interface UserDashboardUIProps {
    initialData: UserProfileData;
    objectives: Objective[];
    userInterestTagIds: number[];
    allTags: Tag[];
    initialResources: Resource[];
}