"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GitBranch,
  Search,
  TrendingUp,
  Shield,
  Users,
  Activity,
  ChevronRight,
  Sparkles,
  BarChart3,
  Target,
} from "lucide-react";

export default function LandingPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) return;

    setIsAnalyzing(true);
    // Navigate to dashboard with repo URL as query param
    const encodedRepo = encodeURIComponent(repoUrl.trim());
    router.push(`/dashboard?repo=${encodedRepo}`);
  };

  const features = [
    {
      icon: TrendingUp,
      title: "Strategic Impact",
      description:
        "Measure real engineering value, not just lines of code. Identify architects vs. maintainers.",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Shield,
      title: "Risk Assessment",
      description:
        "Identify key-person dependencies and potential churn risks before acquisition.",
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
    },
    {
      icon: Users,
      title: "Team Dynamics",
      description:
        "Understand collaboration patterns and knowledge distribution across the team.",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
  ];

  const stats = [
    { label: "Repositories Analyzed", value: "2,847" },
    { label: "Contributors Assessed", value: "34.2K" },
    { label: "Acquisitions Supported", value: "156" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-rose-950/10" />

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "3s" }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center glow-emerald">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">GitValuation</h1>
              <p className="text-xs text-muted-foreground">
                AI Analysis Dashboard
              </p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#methodology"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Methodology
            </a>
            {/* <Button
              variant="outline"
              size="sm"
              className="border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/10"
            >
              Sign In
            </Button> */}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="container mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>M&A Due Diligence Tool</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
              Measure{" "}
              <span className="text-gradient-emerald">Strategic Impact</span>
              <br />
              Not Lines of Code
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Audit engineering teams with precision. GitValuation analyzes
              contribution patterns to identify key architects, assess team
              health, and quantify acquisition risk.
            </p>

            {/* Search Input */}
            <div className="max-w-2xl mx-auto pt-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-rose-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center gap-3 p-2 bg-card border border-border rounded-xl shadow-2xl">
                  <div className="flex items-center gap-3 px-4 flex-1">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="https://github.com/owner/repository"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                      className="flex-1 border-0 bg-transparent text-lg placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !repoUrl.trim()}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-8 rounded-lg font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-emerald-500/40"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 animate-pulse" />
                        Analyzing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Analyze
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Enter a public GitHub repository URL to begin analysis
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-12 pt-12 border-t border-border/50 mt-12">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-gradient-emerald">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Beyond Commit Counts
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Traditional metrics miss the full picture. We analyze patterns
              that reveal true engineering leadership and potential risks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative p-8 rounded-2xl bg-card border border-border hover:border-border/80 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-emerald-500/5 group-hover:to-transparent rounded-2xl transition-all duration-300" />
                <div className="relative space-y-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Methodology Section */}
        <section
          id="methodology"
          className="container mx-auto px-6 py-24 border-t border-border/50"
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold">
                The Strategic Impact Metric
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our proprietary algorithm weights contributions based on their
                lasting value to the codebase. We distinguish between
                architectural decisions, feature development, maintenance work,
                and technical debt.
              </p>
              <div className="space-y-4">
                {[
                  {
                    label: "Architectural Changes",
                    desc: "System design decisions that shape the codebase",
                    icon: Target,
                    color: "emerald",
                  },
                  {
                    label: "Maintenance Work",
                    desc: "Bug fixes, updates, and incremental improvements",
                    icon: BarChart3,
                    color: "amber",
                  },
                  {
                    label: "Risk Indicators",
                    desc: "Code churn, reverts, and dependency patterns",
                    icon: Activity,
                    color: "rose",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/50"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg bg-${item.color}-500/10 flex items-center justify-center flex-shrink-0`}
                    >
                      <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.label}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-rose-500/10 rounded-3xl blur-2xl" />
              <div className="relative p-8 rounded-2xl bg-card border border-border">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Impact Score Distribution
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Last 90 days
                    </span>
                  </div>
                  {/* Mock chart visualization */}
                  <div className="space-y-3">
                    {[
                      {
                        label: "Core Features",
                        value: 35,
                        color: "bg-emerald-500",
                      },
                      { label: "Bug Fixes", value: 25, color: "bg-amber-500" },
                      { label: "Refactoring", value: 18, color: "bg-blue-500" },
                      { label: "Testing", value: 12, color: "bg-purple-500" },
                      {
                        label: "Documentation",
                        value: 10,
                        color: "bg-rose-500",
                      },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.label}
                          </span>
                          <span className="font-mono">{item.value}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-card to-card border border-emerald-500/20">
            <div className="absolute inset-0 bg-grid-pattern opacity-30" />
            <div className="relative p-12 lg:p-16 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Analyze Your Target?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Get comprehensive engineering team insights in minutes. Make
                data-driven acquisition decisions.
              </p>
              <Button
                size="lg"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 rounded-lg font-semibold shadow-lg shadow-emerald-500/25"
              >
                Start Free Analysis
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GitBranch className="w-4 h-4" />
            <span>GitValuation</span>
            <span>•</span>
            <span>© 2025 Cristian Chiorescu</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Engineering Due Diligence Platform
          </div>
        </div>
      </footer>
    </div>
  );
}
