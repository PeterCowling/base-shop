import { NextResponse } from "next/server";
import { z } from "zod";

import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

import { getSession, getSessionUser } from "@/lib/auth";
import { CommitIdentities } from "@/lib/commit-identity";
import { getRepoRoot } from "@/lib/get-repo-root";
import { canEditCard } from "@/lib/permissions";
import { createRepoReader } from "@/lib/repo-reader";
import { createRepoWriter } from "@/lib/repo-writer";
import type { Lane, Priority } from "@/lib/types";

// Phase 0: Node runtime required for git/filesystem operations
export const runtime = "nodejs";

const UpdateCardSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
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

/**
 * Helper: Check authorization for card update
 * MVP-B2: Validates authentication and permissions
 */
async function checkCardUpdateAuthorization(
  request: Request,
  cardId: string
): Promise<NextResponse | null> {
  const authEnabled = process.env.BUSINESS_OS_AUTH_ENABLED === "true";
  if (!authEnabled) {
    return null; // No auth check needed
  }

  // Check authentication
  const response = NextResponse.next();
  const session = await getSession(request, response);
  const user = getSessionUser(session);

  if (!user) {
    return NextResponse.json(
      // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Load card and check permissions
  const repoRoot = getRepoRoot();
  const reader = createRepoReader(repoRoot);
  const existingCard = await reader.getCard(cardId);

  if (!existingCard) {
    return NextResponse.json(
      // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
      { error: "Card not found" },
      { status: 404 }
    );
  }

  if (!canEditCard(user, existingCard)) {
    return NextResponse.json(
      // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
      { error: "You do not have permission to edit this card" },
      { status: 403 }
    );
  }

  return null; // Authorization passed
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

  // MVP-B2: Check authorization
  const authError = await checkCardUpdateAuthorization(request, id);
  if (authError) {
    return authError;
  }

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

    const { title, description, lane, priority, owner, proposedLane, tags, dueDate } =
      parsed.data;

    // Get repo root
    const repoRoot = getRepoRoot();

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

    // Write card (Phase 0: user identity)
    const result = await writer.updateCard(id, updates, CommitIdentities.user);

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
