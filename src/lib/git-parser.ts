// Helper types and functions for parsing git data
// These are NOT server actions - they're utility functions

export interface CommitDiff {
  sha: string;
  author: string;
  authorEmail: string;
  date: string;
  message: string;
  diff: string;
  filesChanged: number;
  additions: number;
  deletions: number;
}

// Helper function to parse git log output into CommitDiff objects
export function parseGitLog(gitLogOutput: string): CommitDiff[] {
  const commits: CommitDiff[] = [];
  const commitBlocks = gitLogOutput.split(/(?=commit [a-f0-9]{40})/);

  for (const block of commitBlocks) {
    if (!block.trim()) continue;

    const shaMatch = block.match(/commit ([a-f0-9]{40})/);
    const authorMatch = block.match(/Author:\s*(.+?)\s*<(.+?)>/);
    const dateMatch = block.match(/Date:\s*(.+)/);
    const messageMatch = block.match(
      /Date:[\s\S]*?\n\n\s*([\s\S]+?)(?=\n\ndiff|$)/
    );
    const diffMatch = block.match(/(diff --git[\s\S]*)/);

    if (shaMatch && authorMatch) {
      // Count additions and deletions from diff
      let additions = 0;
      let deletions = 0;
      let filesChanged = 0;

      if (diffMatch) {
        const diff = diffMatch[1];
        filesChanged = (diff.match(/diff --git/g) || []).length;
        additions = (diff.match(/^\+[^+]/gm) || []).length;
        deletions = (diff.match(/^-[^-]/gm) || []).length;
      }

      commits.push({
        sha: shaMatch[1],
        author: authorMatch[1].trim(),
        authorEmail: authorMatch[2].trim(),
        date: dateMatch ? dateMatch[1].trim() : "",
        message: messageMatch ? messageMatch[1].trim() : "",
        diff: diffMatch ? diffMatch[1] : "",
        filesChanged,
        additions,
        deletions,
      });
    }
  }

  return commits;
}

