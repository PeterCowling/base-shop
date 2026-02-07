/**
 * RecentActivity - Display commits mentioning this card
 * MVP-F1: Commit-to-card linking
 */

import type { CommitEntry } from "@/lib/repo/CommitReader";

interface RecentActivityProps {
  commits: CommitEntry[];
  cardId: string;
}

/* eslint-disable ds/no-hardcoded-copy -- BOS-33: Phase 0 activity UI */
export function RecentActivity({ commits, cardId }: RecentActivityProps) {
  if (commits.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Commits mentioning {cardId}
      </p>

      <div className="space-y-4">
        {commits.map((commit) => (
          <div
            key={commit.hash}
            className="border-l-2 border-blue-500 pl-4 py-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {commit.message}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{commit.author}</span>
                  <span>•</span>
                  <span>{new Date(commit.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <code className="font-mono text-xs bg-gray-100 px-1 rounded">
                    {commit.hash.slice(0, 7)}
                  </code>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {commits.length >= 10 && (
        <p className="text-xs text-gray-500 mt-4">
          Showing most recent 10 commits
        </p>
      )}
    </div>
  );
}
