"use client";

/**
 * ConvertToCardButton component
 * Client component for converting an idea to a card
 */

/* eslint-disable ds/no-hardcoded-copy, ds/min-tap-size -- BOS-12: Phase 0 scaffold UI */

import { useState } from "react";

import { convertToCard } from "./actions";

interface ConvertToCardButtonProps {
  ideaId: string;
}

export function ConvertToCardButton({ ideaId }: ConvertToCardButtonProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConvert() {
    setIsConverting(true);
    setError(null);

    try {
      const result = await convertToCard(ideaId);

      if (!result.success) {
        setError(result.errorKey || "Failed to convert idea to card");
        setIsConverting(false);
      }
      // If successful, redirect happens automatically in the server action
    } catch {
      setError("An unexpected error occurred");
      setIsConverting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleConvert}
        disabled={isConverting}
        className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-700 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConverting ? "Converting..." : "Convert to Card"}
      </button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
