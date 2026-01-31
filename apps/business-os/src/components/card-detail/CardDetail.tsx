"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import type { User } from "@/lib/current-user";
import { canEditCard } from "@/lib/current-user";
import type { CommitHistoryEntry } from "@/lib/git-history";
import { getErrorField, getStringField, safeReadJson } from "@/lib/json";
import type { Business, Card, StageDoc } from "@/lib/types";

import { CardHeader } from "./CardHeader";
import { CardHistory } from "./CardHistory";
import { CardMetadata } from "./CardMetadata";
import { CardStageDocs } from "./CardStageDocs";
import { MarkdownContent } from "./MarkdownContent";

interface CardDetailProps {
  card: Card;
  stageDocs: {
    factFind?: StageDoc;
    plan?: StageDoc;
    build?: StageDoc;
    reflect?: StageDoc;
  };
  business: Business | null;
  currentUser: User;
  history?: CommitHistoryEntry[];
  githubUrl?: string;
}

/* eslint-disable ds/no-unsafe-viewport-units, ds/no-hardcoded-copy, ds/container-widths-only-at, ds/min-tap-size, max-lines-per-function, complexity -- BOS-12: Phase 0 scaffold UI */
export function CardDetail({
  card,
  stageDocs,
  business,
  currentUser,
  history = [],
  githubUrl,
}: CardDetailProps) {
  const router = useRouter();
  const [isClaimingOrAccepting, setIsClaimingOrAccepting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRequestingAgent, setIsRequestingAgent] = useState(false);
  const [agentSuccess, setAgentSuccess] = useState<string | null>(null);

  const userCanEdit = canEditCard(currentUser, card);
  const isOwner = card.Owner === currentUser.name;
  const isUnclaimed = !card.Owner || card.Owner.trim() === "";
  const canAccept = isOwner && card.Lane === "Inbox";
  const canComplete = userCanEdit && card.Lane !== "Done";

  const handleClaim = async () => {
    setIsClaimingOrAccepting(true);
    setActionError(null);

    try {
      const response = await fetch("/api/cards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.ID }),
      });

      const data = await safeReadJson(response);

      if (!response.ok) {
        setActionError(getErrorField(data) || "Failed to claim card");
        setIsClaimingOrAccepting(false);
        return;
      }

      // Success - refresh page to show updated card
      router.refresh();
    } catch {
      setActionError("An unexpected error occurred");
      setIsClaimingOrAccepting(false);
    }
  };

  const handleAccept = async () => {
    setIsClaimingOrAccepting(true);
    setActionError(null);

    try {
      const response = await fetch("/api/cards/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.ID }),
      });

      const data = await safeReadJson(response);

      if (!response.ok) {
        setActionError(getErrorField(data) || "Failed to accept card");
        setIsClaimingOrAccepting(false);
        return;
      }

      // Success - refresh page to show updated card
      router.refresh();
    } catch {
      setActionError("An unexpected error occurred");
      setIsClaimingOrAccepting(false);
    }
  };

  const handleComplete = async () => {
    setIsClaimingOrAccepting(true);
    setActionError(null);

    try {
      const response = await fetch("/api/cards/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.ID }),
      });

      const data = await safeReadJson(response);

      if (!response.ok) {
        setActionError(getErrorField(data) || "Failed to mark card complete");
        setIsClaimingOrAccepting(false);
        return;
      }

      // Success - refresh page to show updated card
      router.refresh();
    } catch {
      setActionError("An unexpected error occurred");
      setIsClaimingOrAccepting(false);
    }
  };

  const handleRequestAgent = async (action: "work-idea" | "break-into-tasks" | "draft-plan") => {
    setIsRequestingAgent(true);
    setActionError(null);
    setAgentSuccess(null);

    try {
      const response = await fetch("/api/agent-queue/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          target: card.ID,
          targetType: "card",
        }),
      });

      const data = await safeReadJson(response);

      if (!response.ok) {
        setActionError(getErrorField(data) || "Failed to request agent work");
        setIsRequestingAgent(false);
        return;
      }

      // Success - show confirmation message
      setAgentSuccess(getStringField(data, "message") || "Agent task queued successfully");
      setIsRequestingAgent(false);
    } catch {
      setActionError("An unexpected error occurred");
      setIsRequestingAgent(false);
    }
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    {
      label: business ? `${business.name} Board` : "Board",
      href: card.Business ? `/boards/${card.Business}` : "/boards/global",
    },
    { label: `Card ${card.ID}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href={
                card.Business
                  ? `/boards/${card.Business}`
                  : "/boards/global"
              }
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              ← Back to Board
            </Link>
            {business && (
              <span className="text-sm text-gray-500">
                {business.name}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {userCanEdit && (
              <Link
                href={`/cards/${card.ID}/edit`}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Edit Card
              </Link>
            )}
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Home
            </Link>
          </div>
        </div>
        <CardHeader card={card} />
      </header>

      {/* Main content */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card body */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Description
              </h2>
              <MarkdownContent content={card.content} />
            </div>

            {/* Stage docs */}
            {(stageDocs.factFind ||
              stageDocs.plan ||
              stageDocs.build ||
              stageDocs.reflect) && (
              <CardStageDocs stageDocs={stageDocs} cardId={card.ID} />
            )}

            {/* History (BOS-28) */}
            {history.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <CardHistory history={history} githubUrl={githubUrl} />
              </div>
            )}
          </div>

          {/* Right column - Metadata */}
          <div className="space-y-6">
            <CardMetadata card={card} />

            {/* Dependencies */}
            {card.Dependencies && card.Dependencies.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Dependencies
                </h3>
                <ul className="space-y-2">
                  {card.Dependencies.map((dep) => (
                    <li key={dep}>
                      <Link
                        href={`/cards/${dep}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {dep}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Actions
              </h3>
              <div className="space-y-2">
                {/* MVP-D1: Claim button (if unclaimed) */}
                {isUnclaimed && (
                  <button
                    type="button"
                    onClick={handleClaim}
                    disabled={isClaimingOrAccepting}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isClaimingOrAccepting ? "Claiming..." : "Claim Card"}
                  </button>
                )}

                {/* MVP-D1: Accept button (if owner and in Inbox) */}
                {canAccept && (
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={isClaimingOrAccepting}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isClaimingOrAccepting ? "Accepting..." : "Accept & Start"}
                  </button>
                )}

                {/* MVP-D2: Mark Complete button (if owner/admin and not Done) */}
                {canComplete && (
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isClaimingOrAccepting}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-purple-600 border border-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isClaimingOrAccepting ? "Completing..." : "Mark Complete"}
                  </button>
                )}

                {/* Error display */}
                {actionError && (
                  <div className="px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {actionError}
                  </div>
                )}

                {/* Success display */}
                {agentSuccess && (
                  <div className="px-3 py-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                    {agentSuccess}
                  </div>
                )}

                {userCanEdit ? (
                  <Link
                    href={`/cards/${card.ID}/edit`}
                    className="block w-full px-3 py-2 text-sm font-medium text-center text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    Edit Card
                  </Link>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    Only {card.Owner || "owner"} and admins can edit
                  </div>
                )}

                {/* MVP-E2: Ask Agent dropdown */}
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleRequestAgent(e.target.value as "work-idea" | "break-into-tasks" | "draft-plan");
                        e.target.value = ""; // Reset selection
                      }
                    }}
                    disabled={isRequestingAgent}
                    className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{isRequestingAgent ? "Requesting..." : "Ask Agent..."}</option>
                    <option value="draft-plan">Draft implementation plan</option>
                    <option value="break-into-tasks">Break into tasks</option>
                    <option value="work-idea">Work this card</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100"
                  disabled
                >
                  Add Comment (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
