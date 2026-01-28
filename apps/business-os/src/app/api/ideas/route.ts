import { NextResponse } from "next/server";
import { z } from "zod";

import { CommitIdentities } from "@/lib/commit-identity";
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
  try {
    const body = await request.json();

    // Validate input
    const parsed = CreateIdeaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { business, content, tags } = parsed.data;

    // Get repo root (remove /apps/business-os from cwd)
    const repoRoot = process.cwd().replace(/\/apps\/business-os$/, "");

    // Validate business ID
    const isValidBusiness = await validateBusinessId(business, repoRoot);
    if (!isValidBusiness) {
      return NextResponse.json(
        { error: `Invalid business ID: ${business}` },
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
          error: "Worktree not initialized",
          hint: "Run: apps/business-os/scripts/setup-worktree.sh",
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
      if (result.needsManualResolution) {
        return NextResponse.json(
          {
            error: result.error,
            needsManualResolution: true,
            hint: "Resolve conflicts manually in the worktree",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: result.error || "Failed to create idea" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ideaId,
        filePath: result.filePath,
        commitHash: result.commitHash,
        message: "Idea created locally. Run Sync to push.",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
