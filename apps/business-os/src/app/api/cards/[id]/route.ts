import { NextResponse } from "next/server";
import { z } from "zod";

import { CommitIdentities } from "@/lib/commit-identity";
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
 * PATCH /api/cards/[id]
 * Update an existing card
 *
 * Phase 0: Pete-only, local-only, no auth
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const parsed = UpdateCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { title, description, lane, priority, owner, proposedLane, tags, dueDate } =
      parsed.data;

    // Get repo root
    const repoRoot = process.cwd().replace(/\/apps\/business-os$/, "");

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
        { error: result.error || "Failed to update card" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cardId: id,
      filePath: result.filePath,
      commitHash: result.commitHash,
      message: "Card updated locally. Run Sync to push.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
