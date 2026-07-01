# gitvaluation

**LLM-powered code & PR analysis.** Point it at any public GitHub repo and it
pulls recent merged pull requests, sends the diffs through an LLM with a
structured-output prompt, and returns a per-contributor impact breakdown.

🔗 **Live demo:** [gitvaluation.vercel.app](https://gitvaluation.vercel.app)

## What it does

- Fetches a repository's recent merged PRs via the **GitHub REST API**.
- Sends each contributor's diffs to **OpenAI** in **JSON mode** for reliable,
  schema-shaped output.
- Scores contributions along a few axes — confidence (root-cause vs. symptom),
  complexity, and net code value — and rolls them into a per-contributor
  summary and archetype.
- Renders the results in a dashboard.

It's a compact demonstration of three things: **third-party API integration**,
**prompt engineering**, and **structured (JSON-mode) LLM output**.

> **Demo mode:** without API keys the app serves a realistic mock analysis, so
> the live demo works without spending tokens.

## Tech

Next.js (App Router) · TypeScript · React · Server Actions · OpenAI API ·
GitHub REST API · Tailwind CSS · shadcn/ui

## Running locally

```bash
pnpm install

# .env.local
# GITHUB_TOKEN=...      # a GitHub token with public repo read access
# OPENAI_API_KEY=...    # for live (non-mock) analysis

pnpm dev                # http://localhost:3000
```

Without the environment variables set, the app falls back to mock data so you
can explore the UI.

## How it works

1. A server action parses the repo URL and fetches merged PRs + diffs from the
   GitHub API (diffs truncated to keep prompts bounded).
2. Commits are grouped by author and sent to the model with a system prompt that
   defines the scoring rubric and requests a strict JSON schema.
3. The response is parsed and aggregated into per-contributor scores and an
   overall ranking, then displayed.
