/**
 * CommentWriter - Write comments as git artifacts
 * MVP-E1: Comments as first-class git artifacts
 */

import path from "node:path";

import matter from "gray-matter";

import type { CommitIdentity } from "../commit-identity";
import { mkdirWithinRoot, writeFileWithinRoot } from "../safe-fs";

export interface CommentData {
  content: string;
  entityType: "card" | "idea";
  entityId: string;
  author: string;
}

export interface WriteCommentResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Write a comment to the repository
 * Creates: docs/business-os/comments/{entityType}/{entityId}/{timestamp}-{author}.md
 */
export async function writeComment(
  repoRoot: string,
  comment: CommentData,
  _identity: CommitIdentity
): Promise<WriteCommentResult> {
  try {
    const timestamp = Date.now();
    const sanitizedAuthor = comment.author.replace(/[^a-zA-Z0-9-]/g, "-");

    const commentDir = path.join(
      repoRoot,
      "docs/business-os/comments",
      comment.entityType,
      comment.entityId
    );

    const fileName = `${timestamp}-${sanitizedAuthor}.md`;
    const filePath = path.join(commentDir, fileName);

    // Create directory if it doesn't exist
    await mkdirWithinRoot(commentDir, repoRoot, { recursive: true });

    // Create comment file with frontmatter
    const frontmatter = {
      Type: "Comment",
      EntityType: comment.entityType,
      EntityId: comment.entityId,
      Author: comment.author,
      Created: new Date().toISOString(),
    };

    const fileContent = matter.stringify(comment.content, frontmatter);

    // Write file
    await writeFileWithinRoot(filePath, repoRoot, fileContent, "utf-8");

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}
