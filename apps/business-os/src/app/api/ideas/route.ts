import { NextResponse } from "next/server";
import { z } from "zod";

import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

import { CommitIdentities } from "@/lib/commit-identity";
import { getRepoRoot } from "@/lib/get-repo-root";
import { generateBusinessOsId, validateBusinessId } from "@/lib/id-generator";
import { createRepoWriter } from "@/lib/repo-writer";

// Phase 0: Node runtime required for git/filesystem operations
export const runtime = "nodejs";

const CreateIdeaSchema = z.object({
  business: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

/**
 * POST /api/ideas
 * Create a new idea in inbox
 *
 * Phase 0: Pete-only, local-only, no auth
 */
export async function POST(request: Request) {
  const t = await getServerTranslations("en");
  try {
    const body = await request.json();

    // Validate input
    const parsed = CreateIdeaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: t("businessOs.api.common.validationFailed"), details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { business, content, tags } = parsed.data;

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

    // Generate ID
    const ideaId = await generateBusinessOsId(business, repoRoot);

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

    // Write idea (Phase 0: user identity)
    const result = await writer.writeIdea(
      {
        ID: ideaId,
        Business: business,
        Status: "raw",
        "Created-Date": new Date().toISOString().split("T")[0],
        Tags: tags,
        content,
      },
      CommitIdentities.user
    );

    if (!result.success) {
      const errorMessage = result.errorKey
        ? t(result.errorKey)
        : t("businessOs.api.ideas.errors.createFailed");

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
        ideaId,
        filePath: result.filePath,
        commitHash: result.commitHash,
        message: t("businessOs.api.ideas.success.created"),
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
