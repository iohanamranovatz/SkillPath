export type Difficulty = "Easy" | "Medium" | "Hard"
export type ResourceType = "Article" | "Video" | "Exercise" | " Course"

export const user = {
    name: "Alex Rivera",
    handle: "@alexr",
    role: "Software Engineer",
    level: "Intermediate",
    avatar: "/professional-headshot.png",
    streak: 12,
    rank: "Top 18%",
}

export const stats = [
    { label: "Tests completed", value: "34", delta: "+4 this week", trend: "up" as const },
    { label: "Average score", value: "82%", delta: "+6% vs last month", trend: "up" as const },
    { label: "Problems solved", value: "418", delta: "+23 this week", trend: "up" as const },
    { label: "Current streak", value: "12 days", delta: "Personal best", trend: "flat" as const },
]

// Skill mastery for the radar chart (0-100)
export const skills = [
    { skill: "Arrays", score: 88 },
    { skill: "Strings", score: 80 },
    { skill: "Graphs", score: 62 },
    { skill: "Dynamic Prog.", score: 54 },
    { skill: "Trees", score: 74 },
    { skill: "Sorting", score: 91 },
]

// Score over time for the line chart
export const scoreHistory = [
    { month: "Mar", score: 61 },
    { month: "Apr", score: 68 },
    { month: "May", score: 65 },
    { month: "Jun", score: 74 },
    { month: "Jul", score: 79 },
    { month: "Aug", score: 82 },
]

export const continueTest = {
    title: "Dynamic Programming — Intermediate",
    topic: "Dynamic Programming",
    difficulty: "Medium" as Difficulty,
    progress: 40,
    questionsLeft: 6,
    estMinutes: 25,
}

export type TestResult = {
    id: string
    title: string
    topic: string
    difficulty: Difficulty
    score: number
    date: string
}

// : TestResult[]
export const recentResults = [
    { id: "r1", title: "Binary Search & Variants", topic: "Algorithms", difficulty: "Medium", score: 92, date: "Aug 14" },
    { id: "r2", title: "Hash Maps Deep Dive", topic: "Data Structures", difficulty: "Easy", score: 100, date: "Aug 11" },
    { id: "r3", title: "Graph Traversal (BFS/DFS)", topic: "Graphs", difficulty: "Hard", score: 68, date: "Aug 8" },
    { id: "r4", title: "Two Pointers Techniques", topic: "Algorithms", difficulty: "Medium", score: 85, date: "Aug 5" },
    { id: "r5", title: "Recursion Fundamentals", topic: "Core", difficulty: "Easy", score: 96, date: "Aug 2" },
]

export type Resource = {
    id: string
    title: string
    type: ResourceType
    topic: string
    minutes: number
    reason: string
}

// : Resource[]
export const recommendedResources = [
    {
        id: "res1",
        title: "Mastering the Knapsack Pattern",
        type: "Article",
        topic: "Dynamic Programming",
        minutes: 14,
        reason: "Boost your weakest area",
    },
    {
        id: "res2",
        title: "Graphs: Shortest Path Algorithms",
        type: "Video",
        topic: "Graphs",
        minutes: 22,
        reason: "Follows your last test",
    },
    {
        id: "res3",
        title: "50 Tree Interview Problems",
        type: "Exercise",
        topic: "Trees",
        minutes: 60,
        reason: "Level up to Advanced",
    },
    {
        id: "res4",
        title: "Big-O Notation, Demystified",
        type: "Course",
        topic: "Complexity",
        minutes: 45,
        reason: "Recommended for you",
    },
]

export const availableTests = [
    { id: "t1", title: "Arrays & Hashing Sprint", difficulty: "Easy" as Difficulty, questions: 12 },
    { id: "t2", title: "Sliding Window Mastery", difficulty: "Medium" as Difficulty, questions: 15 },
    { id: "t3", title: "Advanced Graph Theory", difficulty: "Hard" as Difficulty, questions: 18 },
]

export type View = "Dashboard" | "Tests" | "Results" | "Resources" | "Profile"

export const tests = [
    { id: "ct1", title: "Dynamic Programming", category: "Algorithms", difficulty: "Medium" as Difficulty, questions: 10, time: "25 min", score: 82 },
    { id: "ct2", title: "Data Structures", category: "Coding", difficulty: "Easy" as Difficulty, questions: 12, time: "30 min", score: 91 },
    { id: "ct3", title: "Graph Theory", category: "Algorithms", difficulty: "Hard" as Difficulty, questions: 8, time: "20 min", score: null },
]

export const learningResources = [
    { id: "lr1", title: "Mastering Dynamic Programming", type: "Course" as const, detail: "8 lessons · 2h 40m", tag: "Recommended", icon: "BrainCircuit" as const },
    { id: "lr2", title: "The Coding Interview Guide", type: "E-book" as const, detail: "142 pages · Updated today", tag: "For you", icon: "Code2" as const },
    { id: "lr3", title: "Graph Algorithms Explained", type: "Video series" as const, detail: "12 videos · 1h 15m", tag: "Continue", icon: "LineChart" as const },
]
