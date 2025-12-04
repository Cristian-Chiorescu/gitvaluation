"use server";

// Import types from utility files (non-server action exports)
import { type CommitDiff } from "@/lib/git-parser";

// GitHub API types
interface GitHubPR {
  number: number;
  title: string;
  user: {
    login: string;
  } | null;
  created_at: string;
  merged_at: string | null;
  additions: number;
  deletions: number;
  changed_files: number;
}

interface GitHubPRDetails {
  number: number;
  title: string;
  user: {
    login: string;
    email?: string;
  } | null;
  created_at: string;
  merged_at: string | null;
  additions: number;
  deletions: number;
  changed_files: number;
}

// Parse GitHub repo URL to extract owner and repo
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Handle various GitHub URL formats
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
    /^([^\/]+)\/([^\/]+)$/, // owner/repo format
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    }
  }
  return null;
}

// Fetch recent PRs from GitHub
export async function fetchGitHubPRs(repoUrl: string): Promise<{
  success: boolean;
  commits?: CommitDiff[];
  repoName?: string;
  error?: string;
}> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return {
      success: false,
      error: "GITHUB_TOKEN environment variable is not set",
    };
  }

  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return {
      success: false,
      error:
        "Invalid GitHub repository URL. Use format: https://github.com/owner/repo",
    };
  }

  const { owner, repo } = parsed;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitValuation-App",
  };

  try {
    // Fetch 10 most recent merged PRs
    const prsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=20`,
      { headers }
    );

    if (!prsResponse.ok) {
      if (prsResponse.status === 404) {
        return { success: false, error: "Repository not found" };
      }
      if (prsResponse.status === 401 || prsResponse.status === 403) {
        return {
          success: false,
          error: "GitHub authentication failed. Check your token.",
        };
      }
      const errorText = await prsResponse.text();
      return { success: false, error: `GitHub API error: ${errorText}` };
    }

    const allPRs: GitHubPR[] = await prsResponse.json();

    // Filter to only merged PRs and take 10
    const mergedPRs = allPRs.filter((pr) => pr.merged_at !== null).slice(0, 10);

    if (mergedPRs.length === 0) {
      return {
        success: false,
        error: "No merged pull requests found in this repository",
      };
    }

    // Fetch details and diff for each PR
    const commits: CommitDiff[] = [];

    for (const pr of mergedPRs) {
      try {
        // Fetch PR details (to get additions/deletions)
        const detailsResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}`,
          { headers }
        );

        if (!detailsResponse.ok) continue;

        const prDetails: GitHubPRDetails = await detailsResponse.json();

        // Fetch PR diff
        const diffResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}`,
          {
            headers: {
              ...headers,
              Accept: "application/vnd.github.v3.diff",
            },
          }
        );

        if (!diffResponse.ok) continue;

        let diff = await diffResponse.text();

        // Truncate diff to 1000 chars
        if (diff.length > 1000) {
          diff = diff.substring(0, 1000) + "\n... [truncated at 1000 chars]";
        }

        // Get author email from commits if available
        let authorEmail = `${prDetails.user?.login || "unknown"}@github.com`;
        try {
          const commitsResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/commits?per_page=1`,
            { headers }
          );
          if (commitsResponse.ok) {
            const prCommits = await commitsResponse.json();
            if (prCommits.length > 0 && prCommits[0].commit?.author?.email) {
              authorEmail = prCommits[0].commit.author.email;
            }
          }
        } catch {
          // Use default email
        }

        commits.push({
          sha: `PR-${pr.number}`,
          author: prDetails.user?.login || "Unknown",
          authorEmail,
          date: prDetails.merged_at || prDetails.created_at,
          message: prDetails.title,
          diff,
          filesChanged: prDetails.changed_files,
          additions: prDetails.additions,
          deletions: prDetails.deletions,
        });
      } catch (error) {
        console.error(`Error fetching PR #${pr.number}:`, error);
        // Continue with other PRs
      }
    }

    if (commits.length === 0) {
      return {
        success: false,
        error: "Could not fetch any PR data. Check repository permissions.",
      };
    }

    return {
      success: true,
      commits,
      repoName: `${owner}/${repo}`,
    };
  } catch (error) {
    console.error("GitHub API error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch from GitHub",
    };
  }
}
import {
  type DeveloperArchetype,
  type DeveloperAssessment,
  type AnalysisResult,
} from "@/lib/types";

// Local copy of ARCHETYPES for server-side use (cannot import objects in "use server" files)
const ARCHETYPES: Record<string, DeveloperArchetype> = {
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
- "Architect": Designs systems, makes foundational decisions that scale
- "Surgeon": Precise, high-impact changes with minimal code footprint  
- "Janitor": Valuable! Cleans up technical debt, improves maintainability
- "Feature Factory": Churns out features, quantity over quality concerns
- "Firefighter": Fixes bugs reactively, often fixing issues they created
- "Coaster": Minimal strategic impact, surface-level changes only
- "Perfectionist": Over-engineers solutions, endless refactoring
- "Rising Star": Shows improvement trajectory, high potential

IMPORTANT: Be ruthlessly honest. Private equity needs accurate assessments, not feel-good evaluations. Look for:
- Patterns of introducing then fixing bugs (red flag)
- Deleting more code than adding (often positive)
- Changes to core business logic vs. peripheral code
- Evidence of understanding the broader system

Return your analysis as a valid JSON object.`;

// Function to analyze diffs using OpenAI
// Function to analyze diffs using OpenAI
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
  }, {} as Record<string, { name: string; email?: string; commits: CommitDiff[] }>);

  const assessments: DeveloperAssessment[] = [];

  // Analyze each developer's commits
  for (const [, authorData] of Object.entries(commitsByAuthor)) {
    const { name, email, commits: authorCommits } = authorData;

    if (!authorCommits.length) continue;

    // Prepare commit summaries for the AI (truncate large diffs)
    const commitSummaries = authorCommits.map((c) => ({
      sha: c.sha.substring(0, 7),
      message: c.message,
      date: c.date,
      additions: c.additions,
      deletions: c.deletions,
      filesChanged: c.filesChanged,
      diff:
        c.diff.length > 1000
          ? c.diff.substring(0, 1000) + "\n... [truncated]"
          : c.diff,
    }));

    const userPrompt = `You are analyzing commit diffs for one developer.

Developer: "${name}" (${email || "unknown"})

Here are their commits (JSON):

${JSON.stringify(commitSummaries, null, 2)}

Return ONLY a single JSON object with this exact structure, and nothing else:

{
  "impactGPA": <number 0.0-4.0>,
  "archetype": "<one of: Architect, Surgeon, Janitor, Feature Factory, Firefighter, Coaster, Perfectionist, Rising Star>",
  "assessment": "<one-line assessment, max 200 chars>",
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
            model: "gpt-5-nano",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            // JSON mode: forces the model to return valid JSON only
            response_format: { type: "json_object" },
            // Reasoning effort is supported on GPT-5 models
            reasoning_effort: "low",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error for ${name}:`, errorText);
        continue;
      }

      const data = await response.json();

      // Handle both string and array forms of `message.content`
      const rawContent = data?.choices?.[0]?.message?.content;

      let contentText: string;
      if (typeof rawContent === "string") {
        contentText = rawContent;
      } else if (Array.isArray(rawContent)) {
        contentText = rawContent
          .filter(
            (part: any) => part.type === "text" && typeof part.text === "string"
          )
          .map((part: any) => part.text)
          .join("");
      } else {
        console.error("Unexpected OpenAI content shape:", rawContent);
        continue;
      }

      let analysis: any;
      try {
        analysis = JSON.parse(contentText);
      } catch (parseErr) {
        console.error("Failed to parse OpenAI JSON for", name, {
          contentText,
          parseErr,
        });
        continue;
      }

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
      const archetypeKey = (analysis.archetype || "Coaster")
        .toUpperCase()
        .replace(/\s+/g, "_");
      const archetypeInfo = ARCHETYPES[archetypeKey] || ARCHETYPES.COASTER;

      // Calculate strategic impact from component scores
      const strategicImpact = Math.round(
        (analysis.confidenceScore || 0) * 0.4 +
          (analysis.complexityScore || 0) * 0.35 +
          (analysis.deletionValue || 0) * 0.25
      );

      assessments.push({
        name,
        email: email || "",
        impactGPA: Math.round((analysis.impactGPA || 0) * 100) / 100,
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
  commits: CommitDiff[]
): Promise<AnalysisResult> {
  try {
    if (!commits || commits.length === 0) {
      return {
        success: false,
        error: "No commits provided for analysis",
      };
    }

    const developers = await analyzeWithOpenAI(commits);

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
        archetype: "Architect",
        archetypeInfo: ARCHETYPES.ARCHITECT,
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
        archetype: "Surgeon",
        archetypeInfo: ARCHETYPES.SURGEON,
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
        archetype: "Janitor",
        archetypeInfo: ARCHETYPES.JANITOR,
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
        archetype: "Feature Factory",
        archetypeInfo: ARCHETYPES.FEATURE_FACTORY,
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
        archetype: "Firefighter",
        archetypeInfo: ARCHETYPES.FIREFIGHTER,
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
        archetype: "Coaster",
        archetypeInfo: ARCHETYPES.COASTER,
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
