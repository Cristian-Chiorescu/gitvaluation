"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  GitBranch,
  ArrowLeft,
  Users,
  GitCommit,
  Shield,
  Target,
  Activity,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Brain,
  Trash2,
  Zap,
  Award,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Github,
  AlertCircle,
} from "lucide-react";
import {
  fetchGitHubPRs,
  analyzeRepository,
  analyzeMockRepository,
} from "@/app/actions";
import {
  ARCHETYPES,
  type DeveloperAssessment,
  type AnalysisResult,
} from "@/lib/types";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  Cell,
} from "recharts";

// GPA to Letter Grade conversion
function getLetterGrade(gpa: number): string {
  if (gpa >= 3.9) return "A+";
  if (gpa >= 3.7) return "A";
  if (gpa >= 3.3) return "A-";
  if (gpa >= 3.0) return "B+";
  if (gpa >= 2.7) return "B";
  if (gpa >= 2.3) return "B-";
  if (gpa >= 2.0) return "C+";
  if (gpa >= 1.7) return "C";
  if (gpa >= 1.3) return "C-";
  if (gpa >= 1.0) return "D";
  return "F";
}

// Letter grade color coding: A (Emerald), B (Blue), C (Yellow/Amber), D/F (Rose)
function getGradeColor(gpa: number) {
  if (gpa >= 3.3) return "text-emerald-400"; // A range
  if (gpa >= 2.3) return "text-blue-400"; // B range
  if (gpa >= 1.3) return "text-amber-400"; // C range
  return "text-rose-400"; // D/F range
}

function getGradeBgColor(gpa: number) {
  if (gpa >= 3.3) return "bg-emerald-500/15 border-emerald-500/40"; // A range
  if (gpa >= 2.3) return "bg-blue-500/15 border-blue-500/40"; // B range
  if (gpa >= 1.3) return "bg-amber-500/15 border-amber-500/40"; // C range
  return "bg-rose-500/15 border-rose-500/40"; // D/F range
}

function getGradeShadow(gpa: number) {
  if (gpa >= 3.3) return "shadow-emerald-500/20"; // A range
  if (gpa >= 2.3) return "shadow-blue-500/20"; // B range
  if (gpa >= 1.3) return "shadow-amber-500/20"; // C range
  return "shadow-rose-500/20"; // D/F range
}

// Legacy functions for backward compatibility
function getGPAColor(gpa: number) {
  return getGradeColor(gpa);
}

function getGPABgColor(gpa: number) {
  return getGradeBgColor(gpa);
}

function getArchetypeColor(archetype: string) {
  const key = archetype.toUpperCase().replace(/\s+/g, "_");
  const info = ARCHETYPES[key];
  if (!info) return "text-muted-foreground";

  switch (info.color) {
    case "emerald":
      return "text-emerald-400";
    case "amber":
      return "text-amber-400";
    case "rose":
      return "text-rose-400";
    case "blue":
      return "text-blue-400";
    case "purple":
      return "text-purple-400";
    default:
      return "text-muted-foreground";
  }
}

function getArchetypeBgColor(archetype: string) {
  const key = archetype.toUpperCase().replace(/\s+/g, "_");
  const info = ARCHETYPES[key];
  if (!info) return "bg-muted/50";

  switch (info.color) {
    case "emerald":
      return "bg-emerald-500/10 border-emerald-500/30";
    case "amber":
      return "bg-amber-500/10 border-amber-500/30";
    case "rose":
      return "bg-rose-500/10 border-rose-500/30";
    case "blue":
      return "bg-blue-500/10 border-blue-500/30";
    case "purple":
      return "bg-purple-500/10 border-purple-500/30";
    default:
      return "bg-muted/50";
  }
}

function getScoreBgColor(score: number) {
  if (score >= 75) return "bg-emerald-500/20 border-emerald-500/30";
  if (score >= 50) return "bg-amber-500/20 border-amber-500/30";
  return "bg-rose-500/20 border-rose-500/30";
}

function getScoreColor(score: number) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}

function formatGPA(gpa: number) {
  return gpa.toFixed(2);
}

// Get badge background color matching the grade
function getGradeBadgeBg(gpa: number) {
  if (gpa >= 3.3)
    return "bg-emerald-950 border-emerald-500/50 text-emerald-300"; // A range
  if (gpa >= 2.3) return "bg-blue-950 border-blue-500/50 text-blue-300"; // B range
  if (gpa >= 1.3) return "bg-amber-950 border-amber-500/50 text-amber-300"; // C range
  return "bg-rose-950 border-rose-500/50 text-rose-300"; // D/F range
}

// Report Card Component - displays letter grade with GPA badge
function ReportCard({
  gpa,
  size = "default",
}: {
  gpa: number;
  size?: "small" | "default" | "large";
}) {
  const letterGrade = getLetterGrade(gpa);
  const gradeColor = getGradeColor(gpa);
  const gradeBg = getGradeBgColor(gpa);
  const gradeShadow = getGradeShadow(gpa);
  const badgeBg = getGradeBadgeBg(gpa);

  const sizeClasses = {
    small: {
      container: "w-16 h-20",
      grade: "text-2xl",
      badge: "text-[8px] px-1.5 py-0.5 gap-0.5",
    },
    default: {
      container: "w-20 h-24",
      grade: "text-3xl",
      badge: "text-[10px] px-2 py-1 gap-1",
    },
    large: {
      container: "w-28 h-32",
      grade: "text-5xl",
      badge: "text-xs px-2.5 py-1 gap-1",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`${classes.container} rounded-xl ${gradeBg} border-2 flex flex-col items-center justify-center shadow-lg ${gradeShadow} relative`}
    >
      {/* Letter Grade */}
      <div
        className={`${classes.grade} font-black ${gradeColor} tracking-tight leading-none`}
      >
        {letterGrade}
      </div>

      {/* GPA Badge */}
      <div
        className={`${classes.badge} inline-flex items-center rounded-full border font-mono font-bold mt-1.5 ${badgeBg}`}
      >
        <span>{formatGPA(gpa)}</span>
      </div>
    </div>
  );
}

// Mini Report Card for inline display
function MiniReportCard({ gpa }: { gpa: number }) {
  const letterGrade = getLetterGrade(gpa);
  const gradeColor = getGradeColor(gpa);
  const gradeBg = getGradeBgColor(gpa);
  const badgeBg = getGradeBadgeBg(gpa);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${gradeBg} border-2`}
    >
      <span className={`text-xl font-black ${gradeColor}`}>{letterGrade}</span>
      <div
        className={`text-[10px] px-1.5 py-0.5 rounded-full border font-mono font-bold ${badgeBg}`}
      >
        {formatGPA(gpa)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repo");

  const [expandedContributor, setExpandedContributor] = useState<string | null>(
    null
  );
  const [sortBy, setSortBy] = useState<"gpa" | "risk" | "commits">("gpa");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState<string>("Initializing...");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Ref to prevent double-fetching in React StrictMode
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Prevent double-fetch in StrictMode
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function loadAnalysis() {
      setIsLoading(true);
      setError(null);

      try {
        // If no repo URL provided, use mock data
        if (!repoUrl) {
          setLoadingStatus("Loading demo data...");
          const result = await analyzeMockRepository();
          setAnalysisResult(result);
          return;
        }

        // Fetch real GitHub PRs
        setLoadingStatus("Fetching PRs from GitHub...");
        const githubResult = await fetchGitHubPRs(repoUrl);

        if (!githubResult.success || !githubResult.commits) {
          setError(githubResult.error || "Failed to fetch GitHub data");
          return;
        }

        setLoadingStatus(
          `Analyzing ${githubResult.commits.length} most recent PRs with AI. Will take a minute, grab a coffee...`
        );

        // Analyze the commits with OpenAI
        const result = await analyzeRepository(githubResult.commits);

        if (result.success) {
          setAnalysisResult({
            ...result,
            repository: githubResult.repoName,
          });
        } else {
          setError(result.error || "AI analysis failed");
        }
      } catch (err) {
        console.error("Failed to load analysis:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalysis();
  }, [repoUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-950/10 via-transparent to-rose-950/5 pointer-events-none" />
        <div className="relative text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
            <Brain className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-foreground font-medium">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <span>{loadingStatus}</span>
            </div>
            {repoUrl && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Github className="w-4 h-4" />
                <span>{decodeURIComponent(repoUrl)}</span>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground max-w-sm mx-auto">
            Fetching recent PRs and analyzing code contributions with AI...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
        <div className="relative text-center space-y-6 max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-rose-400">Analysis Failed</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          {repoUrl && (
            <div className="p-4 rounded-lg bg-card border border-border/50 text-left">
              <div className="text-xs text-muted-foreground mb-1">
                Repository
              </div>
              <div className="text-sm font-mono">
                {decodeURIComponent(repoUrl)}
              </div>
            </div>
          )}
          <div className="flex items-center justify-center gap-3">
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Try Another Repo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisResult?.success || !analysisResult.developers) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
        <div className="relative text-center space-y-6 max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-rose-400">Analysis Failed</h2>
            <p className="text-muted-foreground">
              {analysisResult?.error || "Unknown error occurred"}
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const developers = analysisResult.developers;

  const sortedDevelopers = [...developers].sort((a, b) => {
    switch (sortBy) {
      case "gpa":
        return b.impactGPA - a.impactGPA; // Highest GPA first
      case "risk":
        return a.impactGPA - b.impactGPA; // Lowest GPA (highest risk) first
      case "commits":
        return b.commitCount - a.commitCount; // Most commits first
      default:
        return 0;
    }
  });

  const avgGPA =
    developers.reduce((acc, d) => acc + d.impactGPA, 0) / developers.length;
  const avgImpact = Math.round(
    developers.reduce((acc, d) => acc + d.strategicImpact, 0) /
      developers.length
  );
  const totalCommits =
    analysisResult.totalCommits ||
    developers.reduce((acc, d) => acc + d.commitCount, 0);

  // Count archetypes
  const archetypeCounts = developers.reduce((acc, d) => {
    acc[d.archetype] = (acc[d.archetype] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-950/10 via-transparent to-rose-950/5 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-secondary"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  GitValuation
                </h1>
                <p className="text-xs text-muted-foreground">
                  AI Analysis Dashboard
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {repoUrl ? (
              <Badge
                variant="outline"
                className="text-emerald-400 border-emerald-500/30 gap-1"
              >
                <Github className="w-3 h-3" />
                Live Data
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-amber-400 border-amber-500/30 gap-1"
              >
                <Activity className="w-3 h-3" />
                Demo Mode
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-emerald-400 border-emerald-500/30 gap-1"
            >
              <Brain className="w-3 h-3" />
              AI Powered
            </Badge>
            {repoUrl && (
              <a
                href={decodeURIComponent(repoUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Github className="w-4 h-4" />
                  View Repo
                </Button>
              </a>
            )}
            {/* <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Export Report
            </Button> */}
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-6 py-8">
        {/* Repository Info */}
        <section className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">
                  {analysisResult.repository || "Repository Analysis"}
                </h2>
                {repoUrl && (
                  <Badge
                    variant="outline"
                    className="text-purple-400 border-purple-500/30 gap-1"
                  >
                    <GitCommit className="w-3 h-3" />
                    {analysisResult.totalCommits || 0} PRs
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground max-w-2xl">
                AI-powered engineering assessment • Analyzed{" "}
                {repoUrl
                  ? `${analysisResult.totalCommits || 0} recent pull requests`
                  : `${analysisResult.totalCommits || 0} commits`}{" "}
                across {developers.length} contributors
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Analyzed:{" "}
              {analysisResult.analyzedAt
                ? new Date(analysisResult.analyzedAt).toLocaleDateString()
                : "N/A"}
            </div>
          </div>
        </section>

        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <ReportCard gpa={avgGPA} size="default" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Team Average
                  </div>
                  <div
                    className={`text-lg font-semibold ${getGradeColor(avgGPA)}`}
                  >
                    {avgGPA >= 3.3
                      ? "Excellent"
                      : avgGPA >= 2.3
                      ? "Good"
                      : avgGPA >= 1.3
                      ? "Fair"
                      : "Poor"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Overall Grade
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(avgImpact)}`}>
                {avgImpact}
              </div>
              <div className="text-sm text-muted-foreground">
                Avg Strategic Impact
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className="text-3xl font-bold">{developers.length}</div>
              <div className="text-sm text-muted-foreground">
                Contributors Analyzed
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <GitCommit className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div className="text-3xl font-bold">
                {totalCommits.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Commits</div>
            </CardContent>
          </Card>
        </section>

        {/* Archetype Distribution */}
        <section className="mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">
                Team Composition by Archetype
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {Object.entries(archetypeCounts).map(([archetype, count]) => (
                  <Badge
                    key={archetype}
                    variant="outline"
                    className={`${getArchetypeBgColor(
                      archetype
                    )} border px-3 py-1.5`}
                  >
                    <span className={getArchetypeColor(archetype)}>
                      {archetype}
                    </span>
                    <span className="ml-2 text-muted-foreground">×{count}</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Impact vs Volume Scatter Plot */}
        <section className="mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Impact vs. Volume Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Identify high-impact engineers vs. high-churn contributors
              </p>
            </CardHeader>
            <CardContent>
              {/* Chart with quadrant overlays */}
              <div className="relative h-[500px] w-full">
                {/* Quadrant labels positioned on the chart */}
                {/* <div className="absolute top-12 left-16 z-10 pointer-events-none">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <div className="text-emerald-400 font-bold text-sm">
                      🎯 The Snipers
                    </div>
                    <div className="text-emerald-400/70 text-[10px]">
                      High Impact, Low Volume
                    </div>
                  </div>
                </div>
                <div className="absolute top-12 right-16 z-10 pointer-events-none">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <div className="text-blue-400 font-bold text-sm">
                      💪 The Workhorses
                    </div>
                    <div className="text-blue-400/70 text-[10px]">
                      High Impact, High Volume
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-16 left-16 z-10 pointer-events-none">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <div className="text-amber-400 font-bold text-sm">
                      😴 The Coasters
                    </div>
                    <div className="text-amber-400/70 text-[10px]">
                      Low Impact, Low Volume
                    </div>
                  </div>
                </div> */}
                {/* <div className="absolute bottom-16 right-16 z-10 pointer-events-none">
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <div className="text-rose-400 font-bold text-sm">
                      ⚠️ The Churners
                    </div>
                    <div className="text-rose-400/70 text-[10px]">
                      Low Impact, High Volume
                    </div>
                  </div>
                </div> */}

                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
                  >
                    <CartesianGrid
                      strokeDasharray="0 0"
                      stroke="rgba(255,255,255,0.0)"
                    />
                    <XAxis
                      type="number"
                      dataKey="volume"
                      name="Lines Changed"
                      domain={[0, "dataMax + 10"]}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v
                      }
                      tick={{ fill: "#a1a1aa", fontSize: 11 }}
                      axisLine={{ stroke: "#3f3f46" }}
                      tickLine={{ stroke: "#3f3f46" }}
                      label={{
                        value: "Volume (Lines Changed) →",
                        position: "bottom",
                        offset: 40,
                        fill: "#a1a1aa",
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="gpa"
                      name="Impact GPA"
                      domain={[1, 4]}
                      ticks={[1, 1.5, 2, 2.5, 3, 3.5, 4]}
                      tickFormatter={(v) => v.toFixed(1)}
                      tick={{ fill: "#a1a1aa", fontSize: 11 }}
                      axisLine={{ stroke: "#3f3f46" }}
                      tickLine={{ stroke: "#3f3f46" }}
                      label={{
                        value: "Impact GPA →",
                        angle: -90,
                        position: "left",
                        offset: 40,
                        fill: "#a1a1aa",
                        fontSize: 12,
                      }}
                    />

                    {/* Reference lines for quadrants */}
                    <ReferenceLine
                      x={(() => {
                        const volumes = developers.map(
                          (d) => d.totalAdditions + d.totalDeletions
                        );
                        return (
                          volumes.reduce((a, b) => a + b, 0) / volumes.length
                        );
                      })()}
                      stroke="#52525b"
                      strokeDasharray="4 10"
                      strokeWidth={1}
                    />
                    <ReferenceLine
                      y={2.5}
                      stroke="#52525b"
                      strokeDasharray="4 10"
                      strokeWidth={1}
                    />

                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as {
                            name: string;
                            gpa: number;
                            volume: number;
                            assessment: string;
                            archetype: string;
                          };
                          return (
                            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-2xl max-w-xs">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-white">
                                  {data.name}
                                </span>
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded font-bold ${getGradeBadgeBg(
                                    data.gpa
                                  )}`}
                                >
                                  {getLetterGrade(data.gpa)}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-400 mb-2">
                                {data.archetype}
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                                <div className="bg-zinc-800 rounded px-2 py-1">
                                  <span className="text-zinc-500">GPA</span>
                                  <div
                                    className={`font-mono font-bold text-lg ${getGradeColor(
                                      data.gpa
                                    )}`}
                                  >
                                    {data.gpa.toFixed(2)}
                                  </div>
                                </div>
                                <div className="bg-zinc-800 rounded px-2 py-1">
                                  <span className="text-zinc-500">Lines</span>
                                  <div className="font-mono font-bold text-lg text-white">
                                    {data.volume.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs border-t border-zinc-700 pt-2">
                                <div className="text-zinc-500 mb-1 flex items-center gap-1">
                                  <Brain className="w-3 h-3" />
                                  AI Assessment
                                </div>
                                <p className="text-zinc-300 italic leading-relaxed">
                                  "{data.assessment}"
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    <Scatter
                      name="Contributors"
                      data={developers.map((d) => ({
                        name: d.name,
                        gpa: d.impactGPA,
                        volume: d.totalAdditions + d.totalDeletions,
                        assessment: d.assessment,
                        archetype: d.archetype,
                      }))}
                    >
                      {developers.map((d, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            d.impactGPA >= 3.3
                              ? "#34d399"
                              : d.impactGPA >= 2.3
                              ? "#60a5fa"
                              : d.impactGPA >= 1.3
                              ? "#fbbf24"
                              : "#fb7185"
                          }
                          stroke={
                            d.impactGPA >= 3.3
                              ? "#10b981"
                              : d.impactGPA >= 2.3
                              ? "#3b82f6"
                              : d.impactGPA >= 1.3
                              ? "#f59e0b"
                              : "#f43f5e"
                          }
                          strokeWidth={2}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-zinc-400">A Grade (3.3+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-zinc-400">B Grade (2.3-3.3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-zinc-400">C Grade (1.3-2.3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-zinc-400">D/F Grade (&lt;1.3)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Top Contributors Leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold">Engineering Leaderboard</h3>
              <p className="text-sm text-muted-foreground">
                Ranked by AI-assessed impact GPA (0.0 - 4.0)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <div className="flex gap-1">
                {[
                  { key: "gpa", label: "Grade" },
                  { key: "risk", label: "Risk" },
                  { key: "commits", label: "Commits" },
                ].map((option) => (
                  <Button
                    key={option.key}
                    variant={sortBy === option.key ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy(option.key as typeof sortBy)}
                    className={`text-xs ${
                      option.key === "gpa" && sortBy === "gpa"
                        ? "text-emerald-400"
                        : ""
                    }${
                      option.key === "risk" && sortBy === "risk"
                        ? "text-rose-400"
                        : ""
                    }`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {sortedDevelopers.map((developer, index) => {
              const isExpanded = expandedContributor === developer.email;
              const rank = index + 1;

              return (
                <Card
                  key={developer.email}
                  className={`bg-card/50 border-border/50 transition-all duration-300 ${
                    isExpanded ? "ring-1 ring-emerald-500/30" : ""
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Main Row */}
                    <div
                      className="flex items-center gap-6 p-6 cursor-pointer hover:bg-secondary/30 transition-colors"
                      onClick={() =>
                        setExpandedContributor(
                          isExpanded ? null : developer.email
                        )
                      }
                    >
                      {/* Rank */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                          rank === 1
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                            : rank === 2
                            ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                            : rank === 3
                            ? "bg-gradient-to-br from-rose-400 to-rose-500 text-white"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {rank}
                      </div>

                      {/* Avatar & Name */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Avatar className="w-12 h-12 border-2 border-border">
                          <AvatarFallback className="bg-gradient-to-br from-secondary to-muted text-foreground">
                            {developer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">
                              {developer.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`${getArchetypeBgColor(
                                developer.archetype
                              )} border text-xs`}
                            >
                              <span
                                className={getArchetypeColor(
                                  developer.archetype
                                )}
                              >
                                {developer.archetype}
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Report Card Grade */}
                      <ReportCard gpa={developer.impactGPA} size="small" />

                      {/* Quick Stats */}
                      <div className="hidden lg:flex items-center gap-6">
                        <div className="text-center">
                          <div className="font-semibold">
                            {developer.commitCount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Commits
                          </div>
                        </div>
                        <div className="text-center">
                          <div
                            className={`font-semibold ${
                              developer.netLinesChanged < 0
                                ? "text-emerald-400"
                                : ""
                            }`}
                          >
                            {developer.netLinesChanged > 0 ? "+" : ""}
                            {developer.netLinesChanged.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Net Lines
                          </div>
                        </div>
                        <div className="text-center">
                          <div
                            className={`font-semibold ${getScoreColor(
                              developer.strategicImpact
                            )}`}
                          >
                            {developer.strategicImpact}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Impact
                          </div>
                        </div>
                      </div>

                      {/* Assessment Preview */}
                      <div className="hidden xl:block max-w-xs">
                        <p className="text-sm text-muted-foreground italic truncate">
                          "{developer.assessment}"
                        </p>
                      </div>

                      {/* Expand Icon */}
                      <div className="text-muted-foreground">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-border/50 bg-secondary/20">
                        {/* AI Assessment */}
                        <div className="mb-6 p-4 rounded-lg bg-card border border-border/50">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                AI Assessment
                              </div>
                              <p className="text-sm">{developer.assessment}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Score Breakdown */}
                          <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Activity className="w-4 h-4 text-emerald-400" />
                              Score Breakdown
                            </h4>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Zap className="w-4 h-4" />
                                    <span>Confidence</span>
                                  </div>
                                  <span
                                    className={`font-mono ${getScoreColor(
                                      developer.confidenceScore
                                    )}`}
                                  >
                                    {developer.confidenceScore}
                                  </span>
                                </div>
                                <Progress
                                  value={developer.confidenceScore}
                                  className="h-2"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Does the code solve root causes vs. patching
                                  symptoms?
                                </p>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Shield className="w-4 h-4" />
                                    <span>Complexity</span>
                                  </div>
                                  <span
                                    className={`font-mono ${getScoreColor(
                                      developer.complexityScore
                                    )}`}
                                  >
                                    {developer.complexityScore}
                                  </span>
                                </div>
                                <Progress
                                  value={developer.complexityScore}
                                  className="h-2"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Architectural changes vs. trivial
                                  modifications
                                </p>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Trash2 className="w-4 h-4" />
                                    <span>Deletion Value</span>
                                  </div>
                                  <span
                                    className={`font-mono ${getScoreColor(
                                      developer.deletionValue
                                    )}`}
                                  >
                                    {developer.deletionValue}
                                  </span>
                                </div>
                                <Progress
                                  value={developer.deletionValue}
                                  className="h-2"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Cleaning tech debt vs. adding bloat
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Code Stats */}
                          <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Target className="w-4 h-4 text-amber-400" />
                              Code Statistics
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 rounded-lg bg-card border border-border/50">
                                <div className="flex items-center gap-2 text-emerald-400">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="text-2xl font-bold">
                                    +{developer.totalAdditions.toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Lines Added
                                </div>
                              </div>
                              <div className="p-4 rounded-lg bg-card border border-border/50">
                                <div className="flex items-center gap-2 text-rose-400">
                                  <TrendingDown className="w-4 h-4" />
                                  <span className="text-2xl font-bold">
                                    -{developer.totalDeletions.toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Lines Removed
                                </div>
                              </div>
                              <div className="p-4 rounded-lg bg-card border border-border/50 col-span-2">
                                <div
                                  className={`text-2xl font-bold ${
                                    developer.netLinesChanged < 0
                                      ? "text-emerald-400"
                                      : "text-amber-400"
                                  }`}
                                >
                                  {developer.netLinesChanged > 0 ? "+" : ""}
                                  {developer.netLinesChanged.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Net Change{" "}
                                  {developer.netLinesChanged < 0 &&
                                    "(Reducing codebase ✓)"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Commit Analysis */}
                          <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2">
                              <GitCommit className="w-4 h-4 text-blue-400" />
                              Sample Commit Grades
                            </h4>
                            <div className="space-y-2">
                              {developer.commits.slice(0, 4).map((commit) => (
                                <div
                                  key={commit.sha}
                                  className="p-3 rounded-lg bg-card border border-border/50"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <code className="text-xs text-muted-foreground font-mono">
                                      {commit.sha}
                                    </code>
                                    <Badge
                                      variant="outline"
                                      className={`${getScoreBgColor(
                                        commit.grade
                                      )} border text-xs`}
                                    >
                                      <span
                                        className={getScoreColor(commit.grade)}
                                      >
                                        {commit.grade}/100
                                      </span>
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {commit.reasoning}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Grading Scale Legend */}
        <section className="mt-8">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                Grading Scale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* A Grade */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-black text-emerald-400">
                      A
                    </span>
                    <Badge
                      variant="outline"
                      className="text-emerald-400 border-emerald-500/30 text-xs"
                    >
                      3.3 - 4.0
                    </Badge>
                  </div>
                  <div className="text-sm text-emerald-400 font-medium">
                    Outstanding
                  </div>
                  <div className="text-xs text-muted-foreground">
                    10x Engineer • Architects & Surgeons
                  </div>
                </div>

                {/* B Grade */}
                <div className="p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-black text-blue-400">B</span>
                    <Badge
                      variant="outline"
                      className="text-blue-400 border-blue-500/30 text-xs"
                    >
                      2.3 - 3.3
                    </Badge>
                  </div>
                  <div className="text-sm text-blue-400 font-medium">Good</div>
                  <div className="text-xs text-muted-foreground">
                    Solid Contributor • Reliable
                  </div>
                </div>

                {/* C Grade */}
                <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-black text-amber-400">
                      C
                    </span>
                    <Badge
                      variant="outline"
                      className="text-amber-400 border-amber-500/30 text-xs"
                    >
                      1.3 - 2.3
                    </Badge>
                  </div>
                  <div className="text-sm text-amber-400 font-medium">
                    Average
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Standard Output • Room to Grow
                  </div>
                </div>

                {/* D/F Grade */}
                <div className="p-4 rounded-xl bg-rose-500/10 border-2 border-rose-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-black text-rose-400">
                      D/F
                    </span>
                    <Badge
                      variant="outline"
                      className="text-rose-400 border-rose-500/30 text-xs"
                    >
                      0.0 - 1.3
                    </Badge>
                  </div>
                  <div className="text-sm text-rose-400 font-medium">
                    Concerning
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Risk Factor • Needs Review
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
