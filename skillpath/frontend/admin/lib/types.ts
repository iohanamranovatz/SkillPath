export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface Option {
    id: string;
    text: string;
}

export interface Question {
    id: string;
    title: string;
    text: string;
    categoryId: string;
    difficulty: Difficulty;
    options: Option[];
    correctAnswerId: string;
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
    estimated_level: string;
    assessments?: Assessment[];
    readonly profile?: string;
}

export type Assessment = {
    id: number;
    category: Category;
    questions: Question[];
    score: string;
}