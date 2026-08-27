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

export const mockDashboardData: DashboardData = {
  stats: [
    { title: "Total Students", value: 128, change: "+12 this mo." },
    { title: "Assessments", value: 342, change: "+24 this mo." },
    { title: "Questions", value: 156, change: "+8 this mo." },
    { title: "Categories", value: 12, change: "+2 this mo." },
  ],
  assessmentActivity: [
    { day: "Mon", fullDay: "Monday", count: 18 },
    { day: "Tue", fullDay: "Tuesday", count: 25 },
    { day: "Wed", fullDay: "Wednesday", count: 14 },
    { day: "Thu", fullDay: "Thursday", count: 31 },
    { day: "Fri", fullDay: "Friday", count: 22 },
    { day: "Sat", fullDay: "Saturday", count: 36 },
    { day: "Sun", fullDay: "Sunday", count: 28 },
  ],
  topUsers: [
    { id: "1", name: "Alex Johnson", email: "alex@example.com", count: 18, rank: 1 },
    { id: "2", name: "Maria Garcia", email: "maria@example.com", count: 14, rank: 2 },
    { id: "3", name: "David Kim", email: "david@example.com", count: 11, rank: 3 },
  ],
  weakestCategories: [
    { id: "database", label: "Database", percentage: 68 },
    { id: "backend", label: "Backend", percentage: 54 },
    { id: "devops", label: "DevOps", percentage: 41 },
    { id: "frontend", label: "Frontend", percentage: 32 },
    { id: "testing", label: "Testing", percentage: 21 },
  ],
};

export function getDashboardData(): DashboardData {
  return mockDashboardData;
}

import type {Category, Question, User} from "./types";

export const MOCK_QUESTIONS: Question[] = [
    {
        id: "q_1",
        title: "React - useEffect Basics",
        text: "What is the primary purpose of the useEffect dependency array?",
        category: "Frontend",
        difficulty: "EASY",
        options: [
            { id: "opt_1", text: "To trigger re-renders" },
            { id: "opt_2", text: "To control when the side-effect executes" },
            { id: "opt_3", text: "To store component state" },
            { id: "opt_4", text: "To fetch server components" }
        ],
        correctAnswerId: "opt_2",
        isActive: true,
    },
    {
        id: "q_2",
        title: "Node.js - Event Loop",
        text: "Which phase of the Node.js event loop executes setTimeout callbacks?",
        category: "Backend",
        difficulty: "HARD",
        options: [
            { id: "opt_1", text: "Timers Phase" },
            { id: "opt_2", text: "Poll Phase" },
            { id: "opt_3", text: "Check Phase" }
        ],
        correctAnswerId: "opt_1",
        isActive: true,
    },
    {
        id: "q_3",
        title: "SQL - INNER JOIN",
        text: "What does an INNER JOIN return?",
        category: "Database",
        difficulty: "MEDIUM",
        options: [
            { id: "opt_1", text: "All records from the left table" },
            { id: "opt_2", text: "Records that have matching values in both tables" },
            { id: "opt_3", text: "All records from both tables" }
        ],
        correctAnswerId: "opt_2",
        isActive: false,
    }
];



export const users: User[] = [
    {
        id: 1,
        name: "Alex Johnson",
        email: "alex.johnson@example.com",
        estimated_level: "Beginner",
    },
    {
        id: 2,
        name: "Maria Popescu",
        email: "maria.popescu@example.com",
        estimated_level: "Intermediate",
    },
    {
        id: 3,
        name: "David Smith",
        email: "david.smith@example.com",
        estimated_level: "Advanced",
    },
    {
        id: 4,
        name: "Elena Ionescu",
        email: "elena.ionescu@example.com",
        estimated_level: "Beginner",
    },
    {
        id: 5,
        name: "James Wilson",
        email: "james.wilson@example.com",
        estimated_level: "Intermediate",
    },
    {
        id: 6,
        name: "Andrei Popa",
        email: "andrei.popa@example.com",
        estimated_level: "Advanced",
    },
    {
        id: 7,
        name: "Sofia Brown",
        email: "sofia.brown@example.com",
        estimated_level: "Intermediate",
    },
    {
        id: 8,
        name: "Michael Davis",
        email: "michael.davis@example.com",
        estimated_level: "Beginner",
    },
    {
        id: 9,
        name: "Ioana Marin",
        email: "ioana.marin@example.com",
        estimated_level: "Advanced",
    },
    {
        id: 10,
        name: "Robert Taylor",
        email: "robert.taylor@example.com",
        estimated_level: "Intermediate",
    },
];


export const MOCK_CATEGORIES: Category[] = [
    {
        id: '1',
        name: "Frontend Development",
        exerciseCount: 50,
        tags: 'Frontend',
    },
    {
        id: '2',
        name: "Backend Development",
        exerciseCount: 45,
        tags: "Backend",
    },
    {
        id: '3',
        name: "Database",
        exerciseCount: 30,
        tags: "Database",
    },
    {
        id: '4',
        name: "DevOps",
        exerciseCount: 35,
        tags: "DevOps",
    },
    {
        id: '5',
        name: "Testing",
        exerciseCount: 25,
        tags: "Testing",
    },
    {
        id: '6',
        name: "JavaScript",
        exerciseCount: 60,
        tags: "JavaScript",
    },
    {
        id: '7',
        name: "React",
        exerciseCount: 40,
        tags: "React",
    },
    {
        id: '8',
        name: "APIs",
        exerciseCount: 35,
        tags: "API",
    },
    {
        id: '9',
        name: "Software Architecture",
        exerciseCount: 20,
        tags: "Architecture",
    },
    {
        id: '10',
        name: "Git",
        exerciseCount: 28,
        tags: "Git",
    },
];

export const MOCK_USERS: User[] = [
    {
        id: 1,
        name: "Sarah Jenkins",
        email: "sarah.jenkins@example.com",
        estimated_level: "Senior",
        assessments: [
            {
                id: 101,
                category: {
                    id: "cat-1",
                    name: "Frontend",
                    exerciseCount: 15,
                    tags: "React, Next.js, Tailwind"
                },
                questions: [],
                score: "92%"
            },
            {
                id: 102,
                category: {
                    id: "cat-2",
                    name: "Backend",
                    exerciseCount: 12,
                    tags: "Node.js, Express, APIs"
                },
                questions: [],
                score: "88%"
            }
        ]
    },
    {
        id: 2,
        name: "Marcus Chen",
        email: "marcus.chen@example.com",
        estimated_level: "Mid",
        assessments: [
            {
                id: 103,
                category: {
                    id: "cat-1",
                    name: "Frontend",
                    exerciseCount: 15,
                    tags: "React, Next.js, Tailwind"
                },
                questions: [],
                score: "78%"
            }
        ]
    },
    {
        id: 3,
        name: "Elena Rostova",
        email: "elena.rostova@example.com",
        estimated_level: "Junior",
        assessments: []
    },
    {
        id: 4,
        name: "David Kim",
        email: "david.kim@example.com",
        estimated_level: "Senior",
        assessments: [
            {
                id: 104,
                category: {
                    id: "cat-3",
                    name: "Database",
                    exerciseCount: 10,
                    tags: "PostgreSQL, Supabase, SQL"
                },
                questions: [],
                score: "95%"
            }
        ]
    },
    {
        id: 5,
        name: "Aisha Patel",
        email: "aisha.patel@example.com",
        estimated_level: "Mid",
        assessments: [
            {
                id: 105,
                category: {
                    id: "cat-2",
                    name: "Backend",
                    exerciseCount: 12,
                    tags: "Node.js, Express, APIs"
                },
                questions: [],
                score: "84%"
            }
        ]
    }
];