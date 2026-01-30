import { NextResponse } from "next/server";
import { z } from "zod";

import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

import { getSession, getSessionUser } from "@/lib/auth";
import { userToCommitIdentity } from "@/lib/commit-identity";
import { getCurrentUserServer } from "@/lib/current-user";
import { getRepoRoot } from "@/lib/get-repo-root";
import { createRepoReader } from "@/lib/repo-reader";
import { createRepoWriter } from "@/lib/repo-writer";

// Phase 0: Node runtime required for git/filesystem operations
export const runtime = "nodejs";

const AcceptCardSchema = z.object({
  cardId: z.string().min(1),
});

/**
 * POST /api/cards/accept
 * Accept a claimed card (move Lane from Inbox to In progress)
 *
 * MVP-D1: Server action with authorization
 */
export async function POST(request: Request) {
  const t = await getServerTranslations("en");

  // MVP-B2: Check authentication (if auth is enabled)
  const response = NextResponse.next();
  const session = await getSession(request, response);
  const user = getSessionUser(session);

  // Only enforce auth if BUSINESS_OS_AUTH_ENABLED is true
  const authEnabled = process.env.BUSINESS_OS_AUTH_ENABLED === "true";
  if (authEnabled && !user) {
    return NextResponse.json(
      // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const parsed = AcceptCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: t("businessOs.api.common.validationFailed"), details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { cardId } = parsed.data;

    const repoRoot = getRepoRoot();
    const reader = createRepoReader(repoRoot);
    const writer = createRepoWriter(repoRoot);

    // Check if worktree is ready
    const isReady = await writer.isWorktreeReady();
    if (!isReady) {
      return NextResponse.json(
        {
          error: t("businessOs.api.common.worktreeNotInitialized"),
          hint: t("businessOs.api.common.worktreeSetupHint"),
        },
        { status: 500 }
      );
    }

    // Get card to verify it exists
    const card = await reader.getCard(cardId);
    if (!card) {
      return NextResponse.json(
        { error: t("businessOs.api.cards.errors.cardNotFound", { cardId }) },
        { status: 404 }
      );
    }

    // Get authenticated user for git author and audit trail
    const currentUser = await getCurrentUserServer();

    // Check if card is owned by current user
    if (card.Owner !== currentUser.name) {
      return NextResponse.json(
        // i18n-exempt -- MVP-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: `Only the card owner (${card.Owner || "unassigned"}) can accept this card` },
        { status: 403 }
      );
    }

    // Check if card is in Inbox lane
    if (card.Lane !== "Inbox") {
      return NextResponse.json(
        // i18n-exempt -- MVP-D1 Phase 0 API error message [ttl=2026-03-31]
        { error: `Card is already in ${card.Lane} lane (can only accept from Inbox)` },
        { status: 400 }
      );
    }

    const gitAuthor = userToCommitIdentity(currentUser);
    const actorId = currentUser.id;

    // Accept card (move Lane to In progress)
    const result = await writer.updateCard(
      cardId,
      {
        Lane: "In progress",
      },
      gitAuthor,
      actorId,
      actorId // initiator same as actor in Phase 0
    );

    if (!result.success) {
      const errorMessage = result.errorKey
        ? t(result.errorKey)
        : t("businessOs.api.cards.errors.updateFailed");

      if (result.needsManualResolution) {
        return NextResponse.json(
          {
            error: errorMessage,
            needsManualResolution: true,
            hint: t("businessOs.api.common.resolveConflictsHint"),
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        cardId,
        lane: "In progress",
        commitHash: result.commitHash,
        // i18n-exempt -- MVP-D1 Phase 0 API success message [ttl=2026-03-31]
        message: `Card accepted and moved to In progress`,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: t("api.common.internalServerError"), details: String(error) },
      { status: 500 }
    );
  }
}
