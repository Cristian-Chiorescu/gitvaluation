// Mock data representing commit analysis for GitValuation
// This data simulates what we'd receive from the GitHub API

export interface Contributor {
  id: string;
  username: string;
  avatarUrl: string;
  name: string;
  strategicImpact: number; // 0-100 score
  impactTrend: "rising" | "stable" | "declining";
  commits: number;
  pullRequests: number;
  codeReviews: number;
  issuesResolved: number;
  architecturalChanges: number;
  documentationScore: number;
  testCoverage: number;
  avgCommitQuality: number; // 0-100
  riskScore: number; // 0-100 (higher = more risk/churn)
  maintenanceScore: number; // 0-100
  lastActive: string;
  joinedProject: string;
  primaryLanguages: string[];
  impactBreakdown: {
    coreFeatures: number;
    bugFixes: number;
    refactoring: number;
    testing: number;
    documentation: number;
    infrastructure: number;
  };
}

export interface RepositoryStats {
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  totalCommits: number;
  totalContributors: number;
  healthScore: number;
  lastUpdated: string;
  primaryLanguage: string;
  languages: { name: string; percentage: number }[];
}

export interface CommitActivity {
  date: string;
  commits: number;
  strategicCommits: number;
  maintenanceCommits: number;
  riskCommits: number;
}

export const mockRepository: RepositoryStats = {
  name: "enterprise-platform",
  fullName: "acme-corp/enterprise-platform",
  description: "Core enterprise SaaS platform with microservices architecture",
  stars: 2847,
  forks: 423,
  openIssues: 89,
  totalCommits: 15234,
  totalContributors: 23,
  healthScore: 78,
  lastUpdated: "2024-12-03",
  primaryLanguage: "TypeScript",
  languages: [
    { name: "TypeScript", percentage: 64 },
    { name: "Python", percentage: 18 },
    { name: "Go", percentage: 12 },
    { name: "Other", percentage: 6 },
  ],
};

export const mockContributors: Contributor[] = [
  {
    id: "1",
    username: "sarah-chen",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    name: "Sarah Chen",
    strategicImpact: 94,
    impactTrend: "rising",
    commits: 1847,
    pullRequests: 312,
    codeReviews: 489,
    issuesResolved: 234,
    architecturalChanges: 47,
    documentationScore: 82,
    testCoverage: 89,
    avgCommitQuality: 91,
    riskScore: 12,
    maintenanceScore: 34,
    lastActive: "2024-12-03",
    joinedProject: "2021-03-15",
    primaryLanguages: ["TypeScript", "Python"],
    impactBreakdown: {
      coreFeatures: 45,
      bugFixes: 12,
      refactoring: 18,
      testing: 10,
      documentation: 8,
      infrastructure: 7,
    },
  },
  {
    id: "2",
    username: "marcus-johnson",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
    name: "Marcus Johnson",
    strategicImpact: 87,
    impactTrend: "stable",
    commits: 1234,
    pullRequests: 198,
    codeReviews: 567,
    issuesResolved: 178,
    architecturalChanges: 32,
    documentationScore: 91,
    testCoverage: 94,
    avgCommitQuality: 88,
    riskScore: 8,
    maintenanceScore: 45,
    lastActive: "2024-12-02",
    joinedProject: "2020-08-22",
    primaryLanguages: ["TypeScript", "Go"],
    impactBreakdown: {
      coreFeatures: 35,
      bugFixes: 15,
      refactoring: 20,
      testing: 15,
      documentation: 10,
      infrastructure: 5,
    },
  },
  {
    id: "3",
    username: "aisha-patel",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=aisha",
    name: "Aisha Patel",
    strategicImpact: 82,
    impactTrend: "rising",
    commits: 987,
    pullRequests: 156,
    codeReviews: 234,
    issuesResolved: 145,
    architecturalChanges: 28,
    documentationScore: 76,
    testCoverage: 85,
    avgCommitQuality: 84,
    riskScore: 15,
    maintenanceScore: 38,
    lastActive: "2024-12-03",
    joinedProject: "2022-01-10",
    primaryLanguages: ["Python", "TypeScript"],
    impactBreakdown: {
      coreFeatures: 40,
      bugFixes: 18,
      refactoring: 15,
      testing: 12,
      documentation: 5,
      infrastructure: 10,
    },
  },
  {
    id: "4",
    username: "david-mueller",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    name: "David Mueller",
    strategicImpact: 76,
    impactTrend: "stable",
    commits: 756,
    pullRequests: 134,
    codeReviews: 312,
    issuesResolved: 98,
    architecturalChanges: 15,
    documentationScore: 88,
    testCoverage: 92,
    avgCommitQuality: 86,
    riskScore: 18,
    maintenanceScore: 52,
    lastActive: "2024-12-01",
    joinedProject: "2021-06-18",
    primaryLanguages: ["Go", "TypeScript"],
    impactBreakdown: {
      coreFeatures: 28,
      bugFixes: 22,
      refactoring: 18,
      testing: 18,
      documentation: 8,
      infrastructure: 6,
    },
  },
  {
    id: "5",
    username: "emma-wilson",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    name: "Emma Wilson",
    strategicImpact: 71,
    impactTrend: "declining",
    commits: 623,
    pullRequests: 89,
    codeReviews: 178,
    issuesResolved: 67,
    architecturalChanges: 8,
    documentationScore: 65,
    testCoverage: 78,
    avgCommitQuality: 72,
    riskScore: 35,
    maintenanceScore: 48,
    lastActive: "2024-11-28",
    joinedProject: "2022-04-05",
    primaryLanguages: ["TypeScript"],
    impactBreakdown: {
      coreFeatures: 22,
      bugFixes: 28,
      refactoring: 12,
      testing: 8,
      documentation: 15,
      infrastructure: 15,
    },
  },
  {
    id: "6",
    username: "james-o-brien",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
    name: "James O'Brien",
    strategicImpact: 68,
    impactTrend: "stable",
    commits: 534,
    pullRequests: 78,
    codeReviews: 145,
    issuesResolved: 89,
    architecturalChanges: 12,
    documentationScore: 72,
    testCoverage: 81,
    avgCommitQuality: 79,
    riskScore: 22,
    maintenanceScore: 58,
    lastActive: "2024-12-02",
    joinedProject: "2022-09-12",
    primaryLanguages: ["Python", "Go"],
    impactBreakdown: {
      coreFeatures: 25,
      bugFixes: 30,
      refactoring: 15,
      testing: 12,
      documentation: 8,
      infrastructure: 10,
    },
  },
  {
    id: "7",
    username: "yuki-tanaka",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=yuki",
    name: "Yuki Tanaka",
    strategicImpact: 64,
    impactTrend: "rising",
    commits: 412,
    pullRequests: 67,
    codeReviews: 98,
    issuesResolved: 56,
    architecturalChanges: 6,
    documentationScore: 85,
    testCoverage: 88,
    avgCommitQuality: 82,
    riskScore: 14,
    maintenanceScore: 42,
    lastActive: "2024-12-03",
    joinedProject: "2023-02-28",
    primaryLanguages: ["TypeScript", "Python"],
    impactBreakdown: {
      coreFeatures: 30,
      bugFixes: 20,
      refactoring: 10,
      testing: 20,
      documentation: 12,
      infrastructure: 8,
    },
  },
  {
    id: "8",
    username: "alex-rivera",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    name: "Alex Rivera",
    strategicImpact: 58,
    impactTrend: "declining",
    commits: 389,
    pullRequests: 45,
    codeReviews: 67,
    issuesResolved: 34,
    architecturalChanges: 3,
    documentationScore: 55,
    testCoverage: 62,
    avgCommitQuality: 65,
    riskScore: 48,
    maintenanceScore: 65,
    lastActive: "2024-11-25",
    joinedProject: "2023-05-15",
    primaryLanguages: ["TypeScript"],
    impactBreakdown: {
      coreFeatures: 18,
      bugFixes: 35,
      refactoring: 8,
      testing: 5,
      documentation: 4,
      infrastructure: 30,
    },
  },
];

export const mockCommitActivity: CommitActivity[] = [
  {
    date: "2024-11-04",
    commits: 45,
    strategicCommits: 28,
    maintenanceCommits: 12,
    riskCommits: 5,
  },
  {
    date: "2024-11-11",
    commits: 52,
    strategicCommits: 31,
    maintenanceCommits: 15,
    riskCommits: 6,
  },
  {
    date: "2024-11-18",
    commits: 38,
    strategicCommits: 22,
    maintenanceCommits: 12,
    riskCommits: 4,
  },
  {
    date: "2024-11-25",
    commits: 61,
    strategicCommits: 38,
    maintenanceCommits: 18,
    riskCommits: 5,
  },
  {
    date: "2024-12-02",
    commits: 47,
    strategicCommits: 29,
    maintenanceCommits: 14,
    riskCommits: 4,
  },
];

export function getImpactLevel(score: number): "high" | "medium" | "low" {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function getRiskLevel(score: number): "low" | "medium" | "high" {
  if (score <= 20) return "low";
  if (score <= 40) return "medium";
  return "high";
}
