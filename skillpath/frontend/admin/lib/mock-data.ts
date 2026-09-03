export type DashboardStat = {
  title: string;
  value: number;
  change: string;
};

export type AssessmentActivityItem = {
  day: string;
  fullDay: string;
  count: number;
};

export type TopUser = {
  id: string;
  name: string;
  email: string;
  count: number;
  rank: number;
};

export type WeakCategory = {
  id: string;
  label: string;
  percentage: number;
};

export type DashboardData = {
  stats: DashboardStat[];
  assessmentActivity: AssessmentActivityItem[];
  topUsers: TopUser[];
  weakestCategories: WeakCategory[];
};




import type {User} from "./types";

export const users: User[] = [
    {
        id: 1,
        name: "Alex Johnson",
        email: "alex.johnson@example.com",
        estimated_level: "Beginner",
        role: "user",
    },
    {
        id: 2,
        name: "Maria Popescu",
        email: "maria.popescu@example.com",
        estimated_level: "Intermediate",
        role: "user",
    },
    {
        id: 3,
        name: "David Smith",
        email: "david.smith@example.com",
        estimated_level: "Advanced",
        role: "user",
    },
    {
        id: 4,
        name: "Elena Ionescu",
        email: "elena.ionescu@example.com",
        estimated_level: "Beginner",
        role: "user",
    },
    {
        id: 5,
        name: "James Wilson",
        email: "james.wilson@example.com",
        estimated_level: "Intermediate",
        role: "user",
    },
    {
        id: 6,
        name: "Andrei Popa",
        email: "andrei.popa@example.com",
        estimated_level: "Advanced",
        role: "user",
    },
    {
        id: 7,
        name: "Sofia Brown",
        email: "sofia.brown@example.com",
        estimated_level: "Intermediate",
        role: "user",
    },
    {
        id: 8,
        name: "Michael Davis",
        email: "michael.davis@example.com",
        estimated_level: "Beginner",
        role: "user",
    },
    {
        id: 9,
        name: "Ioana Marin",
        email: "ioana.marin@example.com",
        estimated_level: "Advanced",
        role: "user",
    },
    {
        id: 10,
        name: "Robert Taylor",
        email: "robert.taylor@example.com",
        estimated_level: "Intermediate",
        role: "user",
    },
];

