import { NextResponse } from "next/server";
import { z } from "zod";

import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

import { getSession, getSessionUser } from "@/lib/auth";
import { userToCommitIdentity } from "@/lib/commit-identity";
import { getCurrentUserServer } from "@/lib/current-user";
import { getRepoRoot } from "@/lib/get-repo-root";
import { allocateCardId } from "@/lib/id-allocator-instance";
import { validateBusinessId } from "@/lib/id-generator";
import { canCreateCard } from "@/lib/permissions";
import { queueTranslation } from "@/lib/repo/translation-queue";
import { createRepoWriter } from "@/lib/repo-writer";
import type { Lane, Priority } from "@/lib/types";

// Phase 0: Node runtime required for git/filesystem operations
export const runtime = "nodejs";

const CreateCardSchema = z.object({
  business: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  lane: z.enum([
    "Inbox",
    "Fact-finding",
    "Planned",
    "In progress",
    "Blocked",
    "Done",
    "Reflected",
  ]),
  priority: z.enum(["P0", "P1", "P2", "P3", "P4", "P5"]),
  owner: z.string().min(1),
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

/**
 * POST /api/cards
 * Create a new card
 *
 * MVP-B2: Requires authentication
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

  // Check permissions (any authenticated user can create cards)
  if (authEnabled && user && !canCreateCard(user)) {
    return NextResponse.json(
      // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
      { error: "You do not have permission to create cards" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const parsed = CreateCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: t("businessOs.api.common.validationFailed"), details: parsed.error.errors },
        { status: 400 }
      );
    }

    const {
      business,
      title,
      description,
      lane,
      priority,
      owner,
      proposedLane,
      tags,
      dueDate,
    } = parsed.data;

    // Get repo root (remove /apps/business-os from cwd)
    const repoRoot = getRepoRoot();

    // Validate business ID
    const isValidBusiness = await validateBusinessId(business, repoRoot);
    if (!isValidBusiness) {
      return NextResponse.json(
        { error: t("businessOs.api.cards.errors.invalidBusiness", { business }) },
        { status: 400 }
      );
    }

    // Generate ID (MVP-C2: atomic counter-based allocation)
    const cardId = await allocateCardId(business);

    // Create writer
    const writer = createRepoWriter(repoRoot);

    // Check if repo is ready
    const isReady = await writer.isRepoReady();
    if (!isReady) {
      return NextResponse.json(
        {
          error: t("businessOs.api.common.repoNotReady"),
          hint: t("businessOs.api.common.repoSetupHint"),
        },
        { status: 500 }
      );
    }

    // Prepare card content
    const content = `# ${title}\n\n${description}`;

    // Write card (MVP-B3: Audit attribution)
    // Get authenticated user for git author and audit trail
    const currentUser = await getCurrentUserServer();
    const gitAuthor = userToCommitIdentity(currentUser);
    const actorId = currentUser.id;

    const result = await writer.writeCard(
      {
        ID: cardId,
        Lane: lane as Lane,
        Priority: priority as Priority,
        Owner: owner,
        Business: business,
        Title: title,
        "Proposed-Lane": proposedLane as Lane | undefined,
        Tags: tags,
        "Due-Date": dueDate,
        Created: new Date().toISOString().split("T")[0],
        content,
      },
      gitAuthor,
      actorId,
      actorId // initiator same as actor in Phase 0 (user acting for themselves)
    );

    if (!result.success) {
      const errorMessage = result.errorKey
        ? t(result.errorKey)
        : t("businessOs.api.cards.errors.createFailed");

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

    // MVP-G1: Queue translation for new card
    await queueTranslation({
      targetId: cardId,
      targetType: "card",
      initiator: currentUser.name,
      identity: gitAuthor,
      actor: actorId,
    });

    return NextResponse.json(
      {
        success: true,
        cardId,
        filePath: result.filePath,
        commitHash: result.commitHash,
        message: t("businessOs.api.cards.success.created"),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: t("api.common.internalServerError"), details: String(error) },
      { status: 500 }
    );
  }
}
