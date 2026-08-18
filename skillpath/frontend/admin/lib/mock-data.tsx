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
