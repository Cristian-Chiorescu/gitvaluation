"use server";

// Import types from utility files (non-server action exports)
import { type CommitDiff } from "@/lib/git-parser";
import {
  type DeveloperArchetype,
  type DeveloperAssessment,
  type AnalysisResult,
} from "@/lib/types";

// Local copy of ARCHETYPES for server-side use (cannot import objects in "use server" files)
const ARCHETYPES: Record<string, DeveloperArchetype> = {
  THE_ARCHITECT: {
    name: "The Architect",
    description: "Designs systems, makes foundational decisions",
    color: "emerald",
  },
  THE_SURGEON: {
    name: "The Surgeon",
    description: "Precise, high-impact changes with minimal footprint",
    color: "emerald",
  },
  THE_JANITOR: {
    name: "The Janitor",
    description: "Cleans up technical debt, improves maintainability",
    color: "blue",
  },
  THE_FEATURE_FACTORY: {
    name: "The Feature Factory",
    description: "Churns out features, quantity over quality",
    color: "amber",
  },
  THE_FIREFIGHTER: {
    name: "The Firefighter",
    description: "Fixes bugs reactively, often their own",
    color: "amber",
  },
  THE_COASTER: {
    name: "The Coaster",
    description: "Minimal impact, surface-level changes",
    color: "rose",
  },
  THE_PERFECTIONIST: {
    name: "The Perfectionist",
    description: "Over-engineers, refactors endlessly",
    color: "amber",
  },
  THE_RISING_STAR: {
    name: "The Rising Star",
    description: "Improving rapidly, high potential",
    color: "purple",
  },
};

// The system prompt for the AI analysis
const SYSTEM_PROMPT = `You are a Principal Software Architect at a Private Equity firm. Your job is to audit a codebase to find the '10x Engineers' versus the 'Coasters'.

Analyze each commit diff and assign a grade (0-100) based on:

1. **Confidence**: Does the code solve the root cause or just patch a symptom?
   - 90-100: Addresses fundamental architectural issues, prevents future bugs
   - 70-89: Solid implementation that solves the stated problem correctly
   - 50-69: Works but may have edge cases or technical debt
   - 30-49: Patches symptoms, likely to cause future issues
   - 0-29: Band-aid fix, creates more problems than it solves

2. **Complexity**: Is this a difficult architectural change or just a text change?
   - 90-100: System-wide architectural changes, complex algorithms, critical infrastructure
   - 70-89: Multi-component changes requiring deep domain knowledge
   - 50-69: Standard feature implementation with some complexity
   - 30-49: Simple CRUD operations, straightforward changes
   - 0-29: Trivial changes (typos, formatting, comments only)

3. **Net Negative Value**: 
   - Deleting unnecessary code = HIGH VALUE (cleaning technical debt)
   - Adding essential features with minimal code = HIGH VALUE
   - Adding whitespace, excessive logging, boilerplate = LOW VALUE
   - Large additions without clear purpose = NEGATIVE VALUE

Developer Archetypes to assign:
- "The Architect": Designs systems, makes foundational decisions that scale
- "The Surgeon": Precise, high-impact changes with minimal code footprint  
- "The Janitor": Valuable! Cleans up technical debt, improves maintainability
- "The Feature Factory": Churns out features, quantity over quality concerns
- "The Firefighter": Fixes bugs reactively, often fixing issues they created
- "The Coaster": Minimal strategic impact, surface-level changes only
- "The Perfectionist": Over-engineers solutions, endless refactoring
- "The Rising Star": Shows improvement trajectory, high potential

IMPORTANT: Be ruthlessly honest. Private equity needs accurate assessments, not feel-good evaluations. Look for:
- Patterns of introducing then fixing bugs (red flag)
- Deleting more code than adding (often positive)
- Changes to core business logic vs. peripheral code
- Evidence of understanding the broader system

Return your analysis as a valid JSON object.`;

// Function to analyze diffs using OpenAI
async function analyzeWithOpenAI(
  commits: CommitDiff[]
): Promise<DeveloperAssessment[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  // Group commits by author
  const commitsByAuthor = commits.reduce((acc, commit) => {
    const key = commit.authorEmail || commit.author;
    if (!acc[key]) {
      acc[key] = {
        name: commit.author,
        email: commit.authorEmail,
        commits: [],
      };
    }
    acc[key].commits.push(commit);
    return acc;
  }, {} as Record<string, { name: string; email: string; commits: CommitDiff[] }>);

  const assessments: DeveloperAssessment[] = [];

  // Analyze each developer's commits
  for (const [, authorData] of Object.entries(commitsByAuthor)) {
    const { name, email, commits: authorCommits } = authorData;

    // Prepare commit summaries for the AI (truncate large diffs)
    const commitSummaries = authorCommits.map((c) => ({
      sha: c.sha.substring(0, 7),
      message: c.message,
      date: c.date,
      additions: c.additions,
      deletions: c.deletions,
      filesChanged: c.filesChanged,
      diff:
        c.diff.length > 3000
          ? c.diff.substring(0, 3000) + "\n... [truncated]"
          : c.diff,
    }));

    const userPrompt = `Analyze the following commits from developer "${name}" (${email}):

${JSON.stringify(commitSummaries, null, 2)}

Respond with a JSON object in this exact format:
{
  "impactGPA": <number 0.0-4.0>,
  "archetype": "<one of: The Architect, The Surgeon, The Janitor, The Feature Factory, The Firefighter, The Coaster, The Perfectionist, The Rising Star>",
  "assessment": "<one-line assessment, max 100 chars>",
  "confidenceScore": <number 0-100>,
  "complexityScore": <number 0-100>,
  "deletionValue": <number 0-100>,
  "commits": [
    {
      "sha": "<7-char sha>",
      "grade": <number 0-100>,
      "reasoning": "<brief reasoning>"
    }
  ]
}`;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`OpenAI API error for ${name}:`, error);
        continue;
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      // Calculate totals
      const totalAdditions = authorCommits.reduce(
        (sum, c) => sum + c.additions,
        0
      );
      const totalDeletions = authorCommits.reduce(
        (sum, c) => sum + c.deletions,
        0
      );

      // Map archetype string to archetype info
      const archetypeKey = analysis.archetype
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/^THE_/, "THE_");
      const archetypeInfo = ARCHETYPES[archetypeKey] || ARCHETYPES.THE_COASTER;

      // Calculate strategic impact from component scores
      const strategicImpact = Math.round(
        analysis.confidenceScore * 0.4 +
          analysis.complexityScore * 0.35 +
          analysis.deletionValue * 0.25
      );

      assessments.push({
        name,
        email,
        impactGPA: Math.round(analysis.impactGPA * 100) / 100,
        archetype: analysis.archetype,
        archetypeInfo,
        assessment: analysis.assessment,
        commitCount: authorCommits.length,
        totalAdditions,
        totalDeletions,
        netLinesChanged: totalAdditions - totalDeletions,
        confidenceScore: analysis.confidenceScore,
        complexityScore: analysis.complexityScore,
        deletionValue: analysis.deletionValue,
        strategicImpact,
        commits: analysis.commits || [],
      });
    } catch (error) {
      console.error(`Error analyzing commits for ${name}:`, error);
    }
  }

  // Sort by impact GPA descending
  return assessments.sort((a, b) => b.impactGPA - a.impactGPA);
}

// Function to analyze diffs using Anthropic Claude
async function analyzeWithClaude(
  commits: CommitDiff[]
): Promise<DeveloperAssessment[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  // Group commits by author
  const commitsByAuthor = commits.reduce((acc, commit) => {
    const key = commit.authorEmail || commit.author;
    if (!acc[key]) {
      acc[key] = {
        name: commit.author,
        email: commit.authorEmail,
        commits: [],
      };
    }
    acc[key].commits.push(commit);
    return acc;
  }, {} as Record<string, { name: string; email: string; commits: CommitDiff[] }>);

  const assessments: DeveloperAssessment[] = [];

  // Analyze each developer's commits
  for (const [, authorData] of Object.entries(commitsByAuthor)) {
    const { name, email, commits: authorCommits } = authorData;

    // Prepare commit summaries for the AI (truncate large diffs)
    const commitSummaries = authorCommits.map((c) => ({
      sha: c.sha.substring(0, 7),
      message: c.message,
      date: c.date,
      additions: c.additions,
      deletions: c.deletions,
      filesChanged: c.filesChanged,
      diff:
        c.diff.length > 3000
          ? c.diff.substring(0, 3000) + "\n... [truncated]"
          : c.diff,
    }));

    const userPrompt = `Analyze the following commits from developer "${name}" (${email}):

${JSON.stringify(commitSummaries, null, 2)}

Respond with a JSON object in this exact format (no markdown, just raw JSON):
{
  "impactGPA": <number 0.0-4.0>,
  "archetype": "<one of: The Architect, The Surgeon, The Janitor, The Feature Factory, The Firefighter, The Coaster, The Perfectionist, The Rising Star>",
  "assessment": "<one-line assessment, max 100 chars>",
  "confidenceScore": <number 0-100>,
  "complexityScore": <number 0-100>,
  "deletionValue": <number 0-100>,
  "commits": [
    {
      "sha": "<7-char sha>",
      "grade": <number 0-100>,
      "reasoning": "<brief reasoning>"
    }
  ]
}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Claude API error for ${name}:`, error);
        continue;
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Extract JSON from the response (Claude might wrap it in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`Could not parse JSON from Claude response for ${name}`);
        continue;
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Calculate totals
      const totalAdditions = authorCommits.reduce(
        (sum, c) => sum + c.additions,
        0
      );
      const totalDeletions = authorCommits.reduce(
        (sum, c) => sum + c.deletions,
        0
      );

      // Map archetype string to archetype info
      const archetypeKey = analysis.archetype
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/^THE_/, "THE_");
      const archetypeInfo = ARCHETYPES[archetypeKey] || ARCHETYPES.THE_COASTER;

      // Calculate strategic impact from component scores
      const strategicImpact = Math.round(
        analysis.confidenceScore * 0.4 +
          analysis.complexityScore * 0.35 +
          analysis.deletionValue * 0.25
      );

      assessments.push({
        name,
        email,
        impactGPA: Math.round(analysis.impactGPA * 100) / 100,
        archetype: analysis.archetype,
        archetypeInfo,
        assessment: analysis.assessment,
        commitCount: authorCommits.length,
        totalAdditions,
        totalDeletions,
        netLinesChanged: totalAdditions - totalDeletions,
        confidenceScore: analysis.confidenceScore,
        complexityScore: analysis.complexityScore,
        deletionValue: analysis.deletionValue,
        strategicImpact,
        commits: analysis.commits || [],
      });
    } catch (error) {
      console.error(`Error analyzing commits for ${name}:`, error);
    }
  }

  // Sort by impact GPA descending
  return assessments.sort((a, b) => b.impactGPA - a.impactGPA);
}

// Main server action to analyze a repository
export async function analyzeRepository(
  commits: CommitDiff[],
  provider: "openai" | "anthropic" = "openai"
): Promise<AnalysisResult> {
  try {
    if (!commits || commits.length === 0) {
      return {
        success: false,
        error: "No commits provided for analysis",
      };
    }

    let developers: DeveloperAssessment[];

    if (provider === "anthropic") {
      developers = await analyzeWithClaude(commits);
    } else {
      developers = await analyzeWithOpenAI(commits);
    }

    if (developers.length === 0) {
      return {
        success: false,
        error:
          "Failed to analyze any developers. Check API keys and try again.",
      };
    }

    return {
      success: true,
      analyzedAt: new Date().toISOString(),
      totalCommits: commits.length,
      developers,
    };
  } catch (error) {
    console.error("Analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Mock analysis for demo purposes (when no API key is available)
export async function analyzeMockRepository(): Promise<AnalysisResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    success: true,
    repository: "acme-corp/enterprise-platform",
    analyzedAt: new Date().toISOString(),
    totalCommits: 247,
    developers: [
      {
        name: "Sarah Chen",
        email: "sarah.chen@acme.corp",
        impactGPA: 3.87,
        archetype: "The Architect",
        archetypeInfo: ARCHETYPES.THE_ARCHITECT,
        assessment:
          "High strategic value; designed core authentication system and API gateway.",
        commitCount: 47,
        totalAdditions: 4823,
        totalDeletions: 2156,
        netLinesChanged: 2667,
        confidenceScore: 94,
        complexityScore: 91,
        deletionValue: 78,
        strategicImpact: 89,
        commits: [
          {
            sha: "a1b2c3d",
            grade: 95,
            reasoning: "Implemented OAuth2 flow with PKCE",
          },
          {
            sha: "e4f5g6h",
            grade: 88,
            reasoning: "Refactored database connection pooling",
          },
        ],
      },
      {
        name: "Marcus Johnson",
        email: "marcus.j@acme.corp",
        impactGPA: 3.52,
        archetype: "The Surgeon",
        archetypeInfo: ARCHETYPES.THE_SURGEON,
        assessment:
          "Precise fixes; eliminated 3 critical security vulnerabilities with minimal code.",
        commitCount: 38,
        totalAdditions: 1247,
        totalDeletions: 1089,
        netLinesChanged: 158,
        confidenceScore: 89,
        complexityScore: 82,
        deletionValue: 85,
        strategicImpact: 85,
        commits: [
          {
            sha: "i7j8k9l",
            grade: 92,
            reasoning: "Fixed SQL injection in user search",
          },
          {
            sha: "m0n1o2p",
            grade: 85,
            reasoning: "Patched XSS vulnerability in comments",
          },
        ],
      },
      {
        name: "Aisha Patel",
        email: "aisha.p@acme.corp",
        impactGPA: 3.21,
        archetype: "The Janitor",
        archetypeInfo: ARCHETYPES.THE_JANITOR,
        assessment:
          "Exceptional cleanup; deleted 4,200 lines of legacy code safely.",
        commitCount: 52,
        totalAdditions: 892,
        totalDeletions: 4234,
        netLinesChanged: -3342,
        confidenceScore: 82,
        complexityScore: 68,
        deletionValue: 95,
        strategicImpact: 80,
        commits: [
          {
            sha: "q3r4s5t",
            grade: 88,
            reasoning: "Removed deprecated payment processor",
          },
          {
            sha: "u6v7w8x",
            grade: 82,
            reasoning: "Cleaned up unused utility functions",
          },
        ],
      },
      {
        name: "David Mueller",
        email: "david.m@acme.corp",
        impactGPA: 2.84,
        archetype: "The Feature Factory",
        archetypeInfo: ARCHETYPES.THE_FEATURE_FACTORY,
        assessment:
          "High output but concerning patterns; 40% of commits are bug fixes.",
        commitCount: 67,
        totalAdditions: 8923,
        totalDeletions: 1245,
        netLinesChanged: 7678,
        confidenceScore: 65,
        complexityScore: 71,
        deletionValue: 32,
        strategicImpact: 58,
        commits: [
          {
            sha: "y9z0a1b",
            grade: 72,
            reasoning: "Added user dashboard, some edge cases",
          },
          {
            sha: "c2d3e4f",
            grade: 58,
            reasoning: "Fixed bug introduced in previous commit",
          },
        ],
      },
      {
        name: "Emma Wilson",
        email: "emma.w@acme.corp",
        impactGPA: 2.31,
        archetype: "The Firefighter",
        archetypeInfo: ARCHETYPES.THE_FIREFIGHTER,
        assessment:
          "Reactive pattern detected; 60% of bug fixes are for self-introduced issues.",
        commitCount: 45,
        totalAdditions: 3456,
        totalDeletions: 2890,
        netLinesChanged: 566,
        confidenceScore: 52,
        complexityScore: 58,
        deletionValue: 45,
        strategicImpact: 52,
        commits: [
          {
            sha: "g5h6i7j",
            grade: 45,
            reasoning: "Hotfix for production crash (self-caused)",
          },
          {
            sha: "k8l9m0n",
            grade: 62,
            reasoning: "Fixed race condition in checkout flow",
          },
        ],
      },
      {
        name: "James O'Brien",
        email: "james.ob@acme.corp",
        impactGPA: 1.89,
        archetype: "The Coaster",
        archetypeInfo: ARCHETYPES.THE_COASTER,
        assessment:
          "Low strategic value; 70% of commits are documentation and formatting.",
        commitCount: 34,
        totalAdditions: 1567,
        totalDeletions: 234,
        netLinesChanged: 1333,
        confidenceScore: 38,
        complexityScore: 25,
        deletionValue: 22,
        strategicImpact: 30,
        commits: [
          { sha: "o1p2q3r", grade: 35, reasoning: "Updated README formatting" },
          {
            sha: "s4t5u6v",
            grade: 28,
            reasoning: "Added console.log statements for debugging",
          },
        ],
      },
    ],
  };
}
