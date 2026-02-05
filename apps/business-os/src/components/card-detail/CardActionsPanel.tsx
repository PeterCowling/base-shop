"use client";

/* eslint-disable ds/no-hardcoded-copy -- BOS-12: Phase 0 scaffold UI [ttl=2026-03-31] */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { User } from "@/lib/current-user";
import { getStringProp, readJsonSafely } from "@/lib/json";
import type { Card } from "@/lib/types";

type AgentRequestAction = "work-idea" | "break-into-tasks" | "draft-plan";

async function postCardMutation(endpoint: string, cardId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId }),
  });

  const data = await readJsonSafely(response);
  if (response.ok) return { ok: true };

  return {
    ok: false,
    error: getStringProp(data, "error") || "Request failed",
  };
}

async function requestAgentWork(
  action: AgentRequestAction,
  cardId: string
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const response = await fetch("/api/agent-queue/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      target: cardId,
      targetType: "card",
    }),
  });

  const data = await readJsonSafely(response);
  if (!response.ok) {
    return {
      ok: false,
      error: getStringProp(data, "error") || "Failed to request agent work",
    };
  }

  return {
    ok: true,
    message: getStringProp(data, "message") || "Agent task queued successfully",
  };
}

export function CardActionsPanel(props: { card: Card; userCanEdit: boolean; currentUser: User }) {
  const { card, currentUser, userCanEdit } = props;
  const router = useRouter();

  const [isUpdatingCard, setIsUpdatingCard] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRequestingAgent, setIsRequestingAgent] = useState(false);
  const [agentSuccess, setAgentSuccess] = useState<string | null>(null);

  const isOwner = card.Owner === currentUser.name;
  const isUnclaimed = !card.Owner || card.Owner.trim() === "";
  const canAccept = isOwner && card.Lane === "Inbox";
  const canComplete = userCanEdit && card.Lane !== "Done";

  const mutateCard = async (endpoint: string, fallbackError: string) => {
    setIsUpdatingCard(true);
    setActionError(null);

    try {
      const result = await postCardMutation(endpoint, card.ID);
      if (!result.ok) {
        setActionError(result.error || fallbackError);
        return;
      }

      router.refresh();
    } catch {
      setActionError("An unexpected error occurred");
    } finally {
      setIsUpdatingCard(false);
    }
  };

  const handleAgentSelect = (rawValue: string, selectEl: HTMLSelectElement) => {
    if (!rawValue) return;
    if (rawValue === "draft-plan" || rawValue === "break-into-tasks" || rawValue === "work-idea") {
      void (async () => {
        setIsRequestingAgent(true);
        setActionError(null);
        setAgentSuccess(null);

        try {
          const result = await requestAgentWork(rawValue, card.ID);
          if (!result.ok) {
            setActionError(result.error);
            return;
          }
          setAgentSuccess(result.message);
        } catch {
          setActionError("An unexpected error occurred");
        } finally {
          setIsRequestingAgent(false);
          selectEl.value = "";
        }
      })();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>

      <div className="space-y-2">
        {isUnclaimed && (
          <button
            type="button"
            onClick={() => mutateCard("/api/cards/claim", "Failed to claim card")}
            disabled={isUpdatingCard}
            className="w-full px-3 py-3 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdatingCard ? "Claiming..." : "Claim Card"}
          </button>
        )}

        {canAccept && (
          <button
            type="button"
            onClick={() => mutateCard("/api/cards/accept", "Failed to accept card")}
            disabled={isUpdatingCard}
            className="w-full px-3 py-3 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdatingCard ? "Accepting..." : "Accept & Start"}
          </button>
        )}

        {canComplete && (
          <button
            type="button"
            onClick={() => mutateCard("/api/cards/complete", "Failed to mark card complete")}
            disabled={isUpdatingCard}
            className="w-full px-3 py-3 text-sm font-medium text-white bg-purple-600 border border-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdatingCard ? "Completing..." : "Mark Complete"}
          </button>
        )}

        {actionError && (
          <div className="px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {actionError}
          </div>
        )}

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

        <div className="relative">
          <select
            onChange={(e) => handleAgentSelect(e.target.value, e.currentTarget)}
            disabled={isRequestingAgent}
            className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {isRequestingAgent ? "Requesting..." : "Ask Agent..."}
            </option>
            <option value="draft-plan">Draft implementation plan</option>
            <option value="break-into-tasks">Break into tasks</option>
            <option value="work-idea">Work this card</option>
          </select>
        </div>

        <button
          type="button"
          className="w-full px-3 py-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100"
          disabled
        >
          Add Comment (Coming Soon)
        </button>
      </div>
    </div>
  );
}
