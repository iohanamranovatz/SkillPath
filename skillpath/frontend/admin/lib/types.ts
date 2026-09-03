export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface Option {
    id: string;
    text: string;
}

export interface Question {
    id: string;
    title: string;
    text: string;
    category: string;
    difficulty: Difficulty;
    options: Option[];
    correctAnswersId: string;
    isActive: boolean;
}

export interface Category {
    id: string;
    name: string;
    exerciseCount: number;
    tags: string;
}

export type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    estimated_level: string;
    auth_key?: string;
    assessments?: Assessment[];
    readonly profile?: string;
}

export type Assessment = {
    id: number;
    user_id?: number;
    status?: string;
    score_total?: number | null;
    started_at?: string | null;
    completed_at?: string | null;
};

export interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserAdded: (newUser: User) => void;
}

export interface PageProps {
    params: Promise<{ id: string }>;
}

export interface WeakCategory {
    categoryId: number;
    categoryName: string;
    wrongAnswersCount: number;
    totalAnswersCount: number;
    errorPercentage: number;
}