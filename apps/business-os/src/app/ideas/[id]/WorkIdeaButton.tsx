"use client";

/**
 * WorkIdeaButton component
 * Toggles inline editing mode for ideas
 */

/* eslint-disable ds/no-hardcoded-copy, ds/min-tap-size -- BOS-12: Phase 0 scaffold UI */

import { useState } from "react";
import { useRouter } from "next/navigation";

import { IdeaEditorForm } from "./IdeaEditorForm";

export interface WorkIdeaButtonProps {
  ideaId: string;
  initialContent: string;
  initialStatus: string;
}

export function WorkIdeaButton({
  ideaId,
  initialContent,
  initialStatus,
}: WorkIdeaButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // Disable if idea is already worked
  const isDisabled = initialStatus !== "raw";

  const handleSuccess = () => {
    // Refresh page to show updated content
    router.refresh();
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <IdeaEditorForm
        ideaId={ideaId}
        initialContent={initialContent}
        initialStatus={initialStatus}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      disabled={isDisabled}
      className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDisabled ? "Already Worked" : "Work Idea"}
    </button>
  );
}
