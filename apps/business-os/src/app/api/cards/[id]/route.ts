import { NextResponse } from "next/server";
import { z } from "zod";

import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

import { getSession, getSessionUser } from "@/lib/auth";
import { userToCommitIdentity } from "@/lib/commit-identity";
import { getCurrentUserServer } from "@/lib/current-user";
import { getRepoRoot } from "@/lib/get-repo-root";
import { checkCardBaseFileSha } from "@/lib/optimistic-concurrency";
import { canEditCard } from "@/lib/permissions";
import { createRepoReader } from "@/lib/repo-reader";
import { createRepoWriter } from "@/lib/repo-writer";
import type { Lane, Priority } from "@/lib/types";

// Phase 0: Node runtime required for git/filesystem operations
export const runtime = "nodejs";

const UpdateCardSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  baseFileSha: z.string().min(1).optional(),
  force: z.boolean().optional(),
  lane: z
    .enum([
      "Inbox",
      "Fact-finding",
      "Planned",
      "In progress",
      "Blocked",
      "Done",
      "Reflected",
    ])
    .optional(),
  priority: z.enum(["P0", "P1", "P2", "P3", "P4", "P5"]).optional(),
  owner: z.string().min(1).optional(),
  proposedLane: z
    .enum([
      "Inbox",
      "Fact-finding",
      "Planned",
      "In progress",
      "Blocked",
      "Done",
      "Reflected",
    ])
    .optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

async function checkCardOptimisticConcurrency(params: {
  repoRoot: string;
  cardId: string;
  baseFileSha?: string;
  force?: boolean;
}): Promise<NextResponse | null> {
  const { repoRoot, cardId, baseFileSha, force } = params;

  if (!baseFileSha || force === true) {
    return null;
  }

  const result = await checkCardBaseFileSha({ repoRoot, cardId, baseFileSha });
  if (result.ok) {
    return null;
  }

  const reader = createRepoReader(repoRoot);
  const currentCard = await reader.getCard(cardId);

  return NextResponse.json(
    {
      // i18n-exempt -- BOS-32 Phase 0 optimistic concurrency copy [ttl=2026-03-31]
      error: "Conflict: this card changed since you loaded it.",
      conflict: {
        kind: "card",
        id: cardId,
        currentFileSha: result.currentFileSha,
        currentCard,
      },
    },
    { status: 409 }
  );
}

/**
 * Helper: Check authorization for card update
 * MVP-B2: Validates authentication and permissions
 * MVP-B3: Also returns authenticated user ID for audit attribution
 */
async function checkCardUpdateAuthorization(
  request: Request,
  cardId: string
): Promise<{ error: NextResponse; actorId?: undefined } | { error: null; actorId: string }> {
  const authEnabled = process.env.BUSINESS_OS_AUTH_ENABLED === "true";

  // Check authentication
  const response = NextResponse.next();
  const session = await getSession(request, response);
  const user = getSessionUser(session);

  // MVP-B3: Return actor ID for audit attribution
  const actorId = user?.id || "pete";

  if (authEnabled && !user) {
    return {
      error: NextResponse.json(
        // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  // Load card and check permissions (only if auth enabled)
  if (authEnabled) {
    const repoRoot = getRepoRoot();
    const reader = createRepoReader(repoRoot);
    const existingCard = await reader.getCard(cardId);

    if (!existingCard) {
      return {
        error: NextResponse.json(
          // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
          { error: "Card not found" },
          { status: 404 }
        ),
      };
    }

    if (user && !canEditCard(user, existingCard)) {
      return {
        error: NextResponse.json(
          // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
          { error: "You do not have permission to edit this card" },
          { status: 403 }
        ),
      };
    }
  }

  return { error: null, actorId }; // Authorization passed, return actor ID
}

/**
 * PATCH /api/cards/[id]
 * Update an existing card
 *
 * MVP-B2: Requires authentication and authorization
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const t = await getServerTranslations("en");
  const { id } = await params;

  // MVP-B2/B3: Check authorization and get actor ID
  const authResult = await checkCardUpdateAuthorization(request, id);
  if (authResult.error) {
    return authResult.error;
  }
  const actorId = authResult.actorId;

  try {
    const body = await request.json();

    // Validate input
    const parsed = UpdateCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: t("businessOs.api.common.validationFailed"), details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { title, description, baseFileSha, force, lane, priority, owner, proposedLane, tags, dueDate } =
      parsed.data;

    // Get repo root
    const repoRoot = getRepoRoot();

    // MVP-C3 spike: optimistic concurrency check (cards only)
    const concurrencyResponse = await checkCardOptimisticConcurrency({
      repoRoot,
      cardId: id,
      baseFileSha,
      force,
    });
    if (concurrencyResponse) {
      return concurrencyResponse;
    }

    // Create writer
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

    // Build updates object
    const updates: Record<string, unknown> = {};

    if (title !== undefined) {
      updates.Title = title;
    }
    if (lane !== undefined) {
      updates.Lane = lane as Lane;
    }
    if (priority !== undefined) {
      updates.Priority = priority as Priority;
    }
    if (owner !== undefined) {
      updates.Owner = owner;
    }
    if (proposedLane !== undefined) {
      updates["Proposed-Lane"] = proposedLane as Lane;
    }
    if (tags !== undefined) {
      updates.Tags = tags;
    }
    if (dueDate !== undefined) {
      updates["Due-Date"] = dueDate;
    }

    // Update content if title or description changed
    if (title !== undefined || description !== undefined) {
      // We need to read the existing card to get current title/description
      // For now, if both are provided, use them. If only one, we'd need to read first.
      // Simplification for Phase 0: require both if updating content
      if (title && description) {
        updates.content = `# ${title}\n\n${description}`;
      }
    }

    // Write card (MVP-B3: Audit attribution with actor ID from auth helper)
    // Get authenticated user for git author
    const currentUser = await getCurrentUserServer();
    const gitAuthor = userToCommitIdentity(currentUser);

    const result = await writer.updateCard(
      id,
      updates,
      gitAuthor,
      actorId,
      actorId // initiator same as actor in Phase 0 (user acting for themselves)
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

    return NextResponse.json({
      success: true,
      cardId: id,
      filePath: result.filePath,
      commitHash: result.commitHash,
      message: t("businessOs.api.cards.success.updated"),
    });
  } catch (error) {
    return NextResponse.json(
      { error: t("api.common.internalServerError"), details: String(error) },
      { status: 500 }
    );
  }
}
