"use server";

/**
 * Server actions for idea detail page
 * BOS-P2-03+: Idea workflow actions
 */

/* eslint-disable ds/no-hardcoded-copy -- BOS-12: Phase 0 scaffold UI */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import { createRepoWriter } from "@/lib/repo-writer";
import type { Idea } from "@/lib/types";

export interface ConvertToCardResult {
  success: boolean;
  cardId?: string;
  errorKey?: string;
  errorDetails?: string;
}

/**
 * Convert an idea to a card
 * Creates a new card in Inbox lane with the idea's content
 */
export async function convertToCard(
  ideaId: string
): Promise<ConvertToCardResult> {
  const repoRoot = process.cwd().replace(/\/apps\/business-os$/, "");
  const writer = createRepoWriter(repoRoot);

  // Get current user for commit identity
  const currentUser = getCurrentUser();

  // Read the idea first to get its data
  const reader = (await import("@/lib/repo-reader")).createRepoReader(
    repoRoot
  );
  const idea = await reader.getIdea(ideaId);

  if (!idea) {
    return {
      success: false,
      errorKey: "businessOs.ideas.errors.ideaNotFound",
    };
  }

  // Generate card ID from idea ID (e.g., BRIK-OPP-0002 -> BRIK-002)
  const cardId = generateCardIdFromIdea(idea);

  // Extract title from idea content
  const firstLine = idea.content.split("\n").find((line) => line.trim());
  const title = firstLine?.replace(/^#+\s*/, "") || idea.ID || "Untitled";

  // Create card with idea content
  const result = await writer.writeCard(
    {
      ID: cardId,
      Lane: "Inbox",
      Priority: "P2",
      Owner: currentUser.name,
      Title: title,
      Business: idea.Business,
      Tags: idea.Tags || [],
      content: idea.content,
    },
    {
      name: currentUser.name,
      email: currentUser.email,
    }
  );

  if (!result.success) {
    return {
      success: false,
      errorKey: result.errorKey,
      errorDetails: result.errorDetails,
    };
  }

  // Revalidate paths
  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath(`/boards/${idea.Business || "global"}`);
  revalidatePath(`/cards/${cardId}`);

  // Redirect to the new card
  redirect(`/cards/${cardId}`);
}

/**
 * Update an idea's content and status
 * Transitions idea from "raw" to "worked" status
 */
export async function updateIdea(
  ideaId: string,
  content: string
): Promise<ConvertToCardResult> {
  const repoRoot = process.cwd().replace(/\/apps\/business-os$/, "");
  const writer = createRepoWriter(repoRoot);

  // Get current user for commit identity
  const currentUser = getCurrentUser();

  // Read the idea first to verify it exists
  const reader = (await import("@/lib/repo-reader")).createRepoReader(
    repoRoot
  );
  const idea = await reader.getIdea(ideaId);

  if (!idea) {
    return {
      success: false,
      errorKey: "businessOs.ideas.errors.ideaNotFound",
    };
  }

  // Validate content length
  if (content.trim().length < 10) {
    return {
      success: false,
      errorKey: "businessOs.ideas.errors.contentTooShort",
    };
  }

  // Update idea with new content and status
  const result = await writer.updateIdea(
    ideaId,
    {
      Status: "worked",
      content,
    },
    currentUser
  );

  if (!result.success) {
    return {
      success: false,
      errorKey: result.errorKey,
      errorDetails: result.errorDetails,
    };
  }

  // Revalidate idea detail page
  revalidatePath(`/ideas/${ideaId}`);

  return {
    success: true,
  };
}

/**
 * Generate card ID from idea ID
 * BRIK-OPP-0002 -> BRIK-002
 * Removes the OPP segment and pads the number
 */
function generateCardIdFromIdea(idea: Idea): string {
  if (!idea.ID) {
    // Fallback if no ID
    const business = idea.Business || "GLOBAL";
    const timestamp = Date.now().toString().slice(-4);
    return `${business}-${timestamp}`;
  }

  // Parse existing ID format: BUSINESS-OPP-NNN or BUSINESS-SEGMENT-NNN
  const parts = idea.ID.split("-");

  if (parts.length >= 3) {
    // BRIK-OPP-0002 -> BRIK-002
    const business = parts[0];
    const number = parts[parts.length - 1];
    return `${business}-${number}`;
  }

  // Fallback: use idea ID as-is
  return idea.ID;
}
