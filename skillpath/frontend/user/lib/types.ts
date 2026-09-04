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
    userInterestTagIds: number[]; // The ids of the tags selected by the user
    allTags: Tag[]; // All available tags from the tags table
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
    initialOnboardingState: InitialAssessmentOnboardingState;
}

export interface InitialAssessmentOnboardingState {
    requiresInitialAssessment: boolean;
    activeInitialAssessmentId: number | null;
    completedInitialAssessmentId: number | null;
}