import Link from "next/link";

import type { CommitHistoryEntry } from "@/lib/git-history";

interface CardHistoryProps {
  history: CommitHistoryEntry[];
  githubUrl?: string;
}

/* eslint-disable ds/no-arbitrary-tailwind, ds/no-hardcoded-copy -- BOS-28: Phase 0 scaffold UI */
export function CardHistory({ history, githubUrl }: CardHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="mt-6 border-t pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
        <p className="text-sm text-gray-500">No history available</p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">History</h2>
        {githubUrl && (
          <Link
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View full history on GitHub →
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {history.map((commit) => (
          <div
            key={commit.hash}
            className="flex gap-4 text-sm border-l-2 border-gray-200 pl-4 py-2"
          >
            <div className="flex-1">
              <p className="text-gray-900 font-medium">{commit.message}</p>
              <p className="text-gray-600 mt-1">
                {commit.author} •{" "}
                {new Date(commit.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="text-gray-400 font-mono text-xs">
              {commit.hash.substring(0, 7)}
            </div>
          </div>
        ))}
      </div>

      {history.length >= 10 && (
        <p className="text-xs text-gray-500 mt-4">
          Showing last 10 commits. {githubUrl && "View full history on GitHub."}
        </p>
      )}
    </div>
  );
}
