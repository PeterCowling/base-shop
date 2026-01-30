import path from "node:path";

import { NextResponse } from "next/server";
import { z } from "zod";

import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

import { getSession, getSessionUser } from "@/lib/auth";
import { userToCommitIdentity } from "@/lib/commit-identity";
import { getCurrentUserServer } from "@/lib/current-user";
import { getRepoRoot } from "@/lib/get-repo-root";
import { AgentQueueWriter } from "@/lib/repo/AgentQueueWriter";
import { RepoLock } from "@/lib/repo/RepoLock";

// Phase 0: Node runtime required for git/filesystem operations
export const runtime = "nodejs";

const CreateQueueItemSchema = z.object({
  action: z.enum(["work-idea", "break-into-tasks", "draft-plan", "custom"]),
  target: z.string().min(1),
  targetType: z.enum(["card", "idea"]),
  instructions: z.string().optional(),
  content: z.string().optional(),
});

/**
 * POST /api/agent-queue/create
 * Create a new agent queue item
 *
 * MVP-E2: Enable users to request agent work via UI
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
    const parsed = CreateQueueItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: t("businessOs.api.common.validationFailed"), details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { action, target, targetType, instructions, content } = parsed.data;

    const repoRoot = getRepoRoot();
    const worktreePath = path.join(repoRoot, "../base-shop-business-os-store");
    const lockDir = path.join(repoRoot, "docs/business-os/.locks");
    const lock = new RepoLock(lockDir);

    // Create queue writer
    const lockEnabled = process.env.BUSINESS_OS_REPO_LOCK_ENABLED === "true";
    const queueWriter = new AgentQueueWriter(
      worktreePath,
      repoRoot,
      lock,
      lockEnabled
    );

    // Get authenticated user for git author and audit trail
    const currentUser = await getCurrentUserServer();
    const gitAuthor = userToCommitIdentity(currentUser);
    const actorId = currentUser.id;

    // Create queue item
    const result = await queueWriter.createQueueItem(
      action,
      target,
      targetType,
      currentUser.name,
      gitAuthor,
      actorId,
      content,
      instructions
    );

    if (!result.success) {
      const errorMessage = result.errorKey
        ? t(result.errorKey)
        : // i18n-exempt -- MVP-E2 Phase 0 API error message [ttl=2026-03-31]
          "Failed to create agent queue item";

      return NextResponse.json(
        { error: errorMessage, details: result.errorDetails },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        queueId: result.queueId,
        action,
        target,
        commitHash: result.commitHash,
        // i18n-exempt -- MVP-E2 Phase 0 API success message [ttl=2026-03-31]
        message: `Agent task requested: ${action}`,
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
