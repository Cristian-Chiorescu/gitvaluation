// Shared types and constants for GitValuation
// These are NOT server actions - they're types and constants

export interface DeveloperArchetype {
  name: string;
  description: string;
  color: "emerald" | "amber" | "rose" | "blue" | "purple";
}

export const ARCHETYPES: Record<string, DeveloperArchetype> = {
  ARCHITECT: {
    name: "Architect",
    description: "Designs systems, makes foundational decisions",
    color: "emerald",
  },
  SURGEON: {
    name: "Surgeon",
    description: "Precise, high-impact changes with minimal footprint",
    color: "emerald",
  },
  JANITOR: {
    name: "Janitor",
    description: "Cleans up technical debt, improves maintainability",
    color: "blue",
  },
  FEATURE_FACTORY: {
    name: "Feature Factory",
    description: "Churns out features, quantity over quality",
    color: "amber",
  },
  FIREFIGHTER: {
    name: "Firefighter",
    description: "Fixes bugs reactively, often their own",
    color: "amber",
  },
  COASTER: {
    name: "Coaster",
    description: "Minimal impact, surface-level changes",
    color: "rose",
  },
  PERFECTIONIST: {
    name: "Perfectionist",
    description: "Over-engineers, refactors endlessly",
    color: "amber",
  },
  RISING_STAR: {
    name: "Rising Star",
    description: "Improving rapidly, high potential",
    color: "purple",
  },
};

export interface DeveloperAssessment {
  name: string;
  email: string;
  impactGPA: number; // 0.0 - 4.0 scale
  archetype: string;
  archetypeInfo: DeveloperArchetype;
  assessment: string;
  commitCount: number;
  totalAdditions: number;
  totalDeletions: number;
  netLinesChanged: number;
  confidenceScore: number; // 0-100
  complexityScore: number; // 0-100
  deletionValue: number; // 0-100 (higher = more valuable deletions)
  strategicImpact: number; // 0-100 overall score
  commits: {
    sha: string;
    grade: number;
    reasoning: string;
  }[];
}

export interface AnalysisResult {
  success: boolean;
  repository?: string;
  analyzedAt?: string;
  totalCommits?: number;
  developers?: DeveloperAssessment[];
  error?: string;
}
