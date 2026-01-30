/**
 * CommentThread - Display and add comments
 * MVP-E1: Comments as first-class git artifacts
 */

"use client";

import { useState } from "react";

import type { Comment } from "@/lib/repo/CommentReader";

interface CommentThreadProps {
  comments: Comment[];
  entityType: "card" | "idea";
  entityId: string;
  currentUserName: string;
}

/* eslint-disable ds/no-hardcoded-copy, ds/min-tap-size -- BOS-33: Phase 0 comment UI */
export function CommentThread({
  comments,
  entityType,
  entityId,
  currentUserName: _currentUserName,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          entityType,
          entityId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to post comment");
        setIsSubmitting(false);
        return;
      }

      // Success - reload page to show new comment
      setNewComment("");
      window.location.reload();
    } catch {
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Comments ({comments.length})
      </h2>

      {/* Existing comments */}
      <div className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="border-l-2 border-gray-300 pl-4 py-2"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {comment.author}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.created).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-4">
        <label htmlFor="new-comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="new-comment"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isSubmitting}
        />

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}

        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="px-4 py-2 min-h-11 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>
    </div>
  );
}
