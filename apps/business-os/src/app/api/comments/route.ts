import { NextResponse } from "next/server";
import { z } from "zod";

import { userToCommitIdentity } from "@/lib/commit-identity";
import { getCurrentUserServer } from "@/lib/current-user";
import { getRepoRoot } from "@/lib/get-repo-root";
import { writeComment } from "@/lib/repo/CommentWriter";

// Phase 0: Node runtime required for filesystem operations
export const runtime = "nodejs";

const CreateCommentSchema = z.object({
  content: z.string().min(1),
  entityType: z.enum(["card", "idea"]),
  entityId: z.string().min(1),
});

/**
 * POST /api/comments
 * Create a new comment
 *
 * MVP-E1: Comments as first-class git artifacts
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = CreateCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-33 MVP-E1 API error message [ttl=2026-03-31]
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { content, entityType, entityId } = parsed.data;

    // Get current user
    const currentUser = await getCurrentUserServer();
    const gitAuthor = userToCommitIdentity(currentUser);

    // Get repo root
    const repoRoot = getRepoRoot();

    // Write comment
    const result = await writeComment(
      repoRoot,
      {
        content,
        entityType,
        entityId,
        author: currentUser.name,
      },
      gitAuthor
    );

    if (!result.success) {
      return NextResponse.json(
        // i18n-exempt -- BOS-33 MVP-E1 API error message [ttl=2026-03-31]
        { error: "Failed to create comment", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        filePath: result.filePath,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      // i18n-exempt -- BOS-33 MVP-E1 API error message [ttl=2026-03-31]
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
