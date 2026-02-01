"use server";

/**
 * Server actions for idea detail page
 * BOS-P2-03+: Idea workflow actions
 */

 

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  appendAuditEntry,
  type Card,
  getCardById,
  getIdeaById,
  type Idea,
  upsertCard,
  upsertIdea,
} from "@acme/platform-core/repositories/businessOs.server";

import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

export interface ConvertToCardResult {
  success: boolean;
  cardId?: string;
  errorKey?: string;
  errorDetails?: string;
}

async function getIdeaFileSha(idea: Idea): Promise<string> {
  if (idea.fileSha) {
    return idea.fileSha;
  }

  return computeEntitySha(idea as unknown as Record<string, unknown>);
}

/**
 * Convert an idea to a card
 * Creates a new card in Inbox lane with the idea's content
 *
 * MVP-B2: Server action with session validation
 */
export async function convertToCard(
  ideaId: string
): Promise<ConvertToCardResult> {
  const db = getDb();
  const currentUser = await getCurrentUserServer();

  // Read the idea first to get its data
  const idea = await getIdeaById(db, ideaId);

  if (!idea) {
    return {
      success: false,
      errorKey: "businessOs.ideas.errors.ideaNotFound",
    };
  }

  // Generate card ID from idea ID (e.g., BRIK-OPP-0002 -> BRIK-002)
  const cardId = generateCardIdFromIdea({
    id: idea.ID ?? ideaId,
    business: idea.Business,
  });

  // Extract title from idea content
  const firstLine = idea.content.split("\n").find((line) => line.trim());
  const title = firstLine?.replace(/^#+\s*/, "") || idea.ID || "Untitled";

  // Fail closed rather than overwriting an existing card
  const existingCard = await getCardById(db, cardId);
  if (existingCard) {
    return {
      success: false,
      errorKey: "businessOs.cards.errors.cardAlreadyExists",
    };
  }

  const cardBase: Card = {
    Type: "Card",
    ID: cardId,
    Lane: "Inbox",
    Priority: "P2",
    Owner: currentUser.name,
    Title: title,
    Business: idea.Business,
    Tags: idea.Tags ?? [],
    content: idea.content,
    filePath: `docs/business-os/cards/${cardId}.user.md`,
  };

  const card: Card = {
    ...cardBase,
    fileSha: await computeEntitySha(cardBase as unknown as Record<string, unknown>),
  };

  const result = await upsertCard(db, card, null);
  if (!result.success) {
    return {
      success: false,
      errorKey: "businessOs.cards.errors.cardWriteFailed",
      errorDetails: result.error,
    };
  }

  // BOS-D1-09: Re-enable "Recent Activity" view by consuming D1 audit log
  await appendAuditEntry(db, {
    entity_type: "card",
    entity_id: cardId,
    action: "create",
    actor: currentUser.id,
    changes_json: JSON.stringify({ fromIdeaId: ideaId }),
  });

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
 *
 * MVP-B2: Server action with session validation
 * MVP-C3: Optimistic concurrency with baseFileSha
 */
export async function updateIdea(
  ideaId: string,
  content: string,
  baseFileSha?: string,
  force?: boolean
): Promise<
  ConvertToCardResult & {
    conflict?: { currentIdea: unknown; currentFileSha: string };
  }
> {
  const db = getDb();
  const currentUser = await getCurrentUserServer();

  // Read the idea first to verify it exists
  const idea = await getIdeaById(db, ideaId);

  if (!idea) {
    return {
      success: false,
      errorKey: "businessOs.ideas.errors.ideaNotFound",
    };
  }

  // MVP-C3: Optimistic concurrency check
  const currentFileSha = await getIdeaFileSha(idea);
  if (baseFileSha && !force && currentFileSha !== baseFileSha) {
    return {
      success: false,
      errorKey: "businessOs.ideas.errors.conflict",
      // i18n-exempt -- MVP-C3 Phase 0 optimistic concurrency copy [ttl=2026-03-31]
      errorDetails: "This idea changed since you loaded it.",
      conflict: {
        currentIdea: idea,
        currentFileSha,
      },
    };
  }

  // Validate content length
  if (content.trim().length < 10) {
    return {
      success: false,
      errorKey: "businessOs.ideas.errors.contentTooShort",
    };
  }

  const ideaBase: Idea = {
    ...idea,
    ID: idea.ID ?? ideaId,
    Status: "worked",
    content,
  };

  const updatedIdea: Idea = {
    ...ideaBase,
    fileSha: await computeEntitySha(ideaBase as unknown as Record<string, unknown>),
  };

  const result = await upsertIdea(db, updatedIdea, "worked");
  if (!result.success) {
    return {
      success: false,
      errorKey: "businessOs.ideas.errors.ideaWriteFailed",
    };
  }

  // BOS-D1-09: Re-enable "Recent Activity" view by consuming D1 audit log
  await appendAuditEntry(db, {
    entity_type: "idea",
    entity_id: ideaId,
    action: "update",
    actor: currentUser.id,
    changes_json: JSON.stringify({ status: "worked" }),
  });

  // Revalidate idea detail page
  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath(`/boards/${idea.Business || "global"}`);

  return {
    success: true,
  };
}

/**
 * Generate card ID from idea ID
 * BRIK-OPP-0002 -> BRIK-002
 * Removes the OPP segment and pads the number
 */
function generateCardIdFromIdea(idea: {
  id: string;
  business?: string;
}): string {
  // Parse existing ID format: BUSINESS-OPP-NNN or BUSINESS-SEGMENT-NNN
  const parts = idea.id.split("-");

  if (parts.length >= 3) {
    // BRIK-OPP-0002 -> BRIK-002
    const business = parts[0];
    const number = parts[parts.length - 1];
    return `${business}-${number}`;
  }

  // Fallback: use the ID as-is if it doesn't match the standard idea format
  return idea.id;
}
