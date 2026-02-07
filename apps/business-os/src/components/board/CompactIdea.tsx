import Link from "next/link";

import type { Idea } from "@/lib/types";

interface CompactIdeaProps {
  idea: Idea;
  showBusinessTag: boolean;
}

/* eslint-disable ds/no-hardcoded-copy -- BOS-11: Phase 0 scaffold UI */
export function CompactIdea({ idea, showBusinessTag }: CompactIdeaProps) {
  // Extract title from content (first line of markdown)
  const firstLine = idea.content.split("\n").find((line) => line.trim());
  const title = firstLine?.replace(/^#+\s*/, "") || idea.ID || "Untitled Idea";

  return (
    <Link
      href={`/ideas/${idea.ID}`}
      className="block bg-yellow-50 rounded-lg border border-yellow-200 p-3 hover:shadow-md transition-shadow"
    >
      {/* Title */}
      <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
        {title}
      </h3>

      {/* Metadata */}
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 bg-yellow-200 text-yellow-900 rounded font-medium">
          Idea
        </span>
        {showBusinessTag && idea.Business && (
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
            {idea.Business}
          </span>
        )}
      </div>

      {/* Status */}
      {idea.Status && (
        <div className="mt-2 text-xs text-gray-600">
          Status: <span className="font-medium">{idea.Status}</span>
        </div>
      )}
    </Link>
  );
}
