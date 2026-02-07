/**
 * CommentReader - Read comments from git artifacts
 * MVP-E1: Comments as first-class git artifacts
 */

import path from "node:path";

import matter from "gray-matter";

import { accessWithinRoot, readdirWithinRoot, readFileWithinRoot } from "../safe-fs";

export interface Comment {
  id: string; // filename without extension
  entityType: "card" | "idea";
  entityId: string;
  author: string;
  created: string;
  content: string;
}

/**
 * Read comments for an entity
 */
export async function getCommentsForEntity(
  repoRoot: string,
  entityType: "card" | "idea",
  entityId: string
): Promise<Comment[]> {
  try {
    const commentDir = path.join(
      repoRoot,
      "docs/business-os/comments",
      entityType,
      entityId
    );

    // Check if directory exists
    try {
      await accessWithinRoot(commentDir, repoRoot);
    } catch {
      // Directory doesn't exist - no comments yet
      return [];
    }

    // Read all files in directory
    const files = await readdirWithinRoot(commentDir, repoRoot);

    // Filter for .md files
    const mdFiles = files.filter((file) => file.endsWith(".md"));

    // Read and parse each comment
    const comments = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = path.join(commentDir, file);
        const content = await readFileWithinRoot(filePath, repoRoot, "utf-8");
        const parsed = matter(content);

        return {
          id: file.replace(".md", ""),
          entityType: parsed.data.EntityType as "card" | "idea",
          entityId: parsed.data.EntityId as string,
          author: parsed.data.Author as string,
          created: parsed.data.Created as string,
          content: parsed.content,
        };
      })
    );

    // Sort by created date (oldest first)
    return comments.sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
    );
  } catch (error) {
    console.error(`Failed to get comments for ${entityType}/${entityId}:`, error);
    return [];
  }
}
