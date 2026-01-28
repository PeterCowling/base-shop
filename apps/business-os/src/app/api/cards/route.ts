import { NextResponse } from "next/server";
import { z } from "zod";

import { CommitIdentities } from "@/lib/commit-identity";
import { generateBusinessOsId, validateBusinessId } from "@/lib/id-generator";
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
 * Phase 0: Pete-only, local-only, no auth
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = CreateCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.errors },
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
    const cardId = await generateBusinessOsId(business, repoRoot);

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

    // Prepare card content
    const content = `# ${title}\n\n${description}`;

    // Write card (Phase 0: user identity)
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
        { error: result.error || "Failed to create card" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        cardId,
        filePath: result.filePath,
        commitHash: result.commitHash,
        message: "Card created locally. Run Sync to push.",
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
