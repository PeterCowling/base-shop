import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import matter from "gray-matter";

import { archiveItem, filterArchived, isArchived } from "./archive";
import { CommitIdentities } from "./commit-identity";

describe("archive", () => {
  let tempDir: string;
  let worktreePath: string;

  beforeEach(async () => {
    // Create temporary directory structure
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "business-os-archive-"));
    worktreePath = path.join(tempDir, "worktree");

    // Initialize minimal git structure
    await fs.mkdir(path.join(worktreePath, ".git"), { recursive: true });
    await fs.mkdir(path.join(worktreePath, "docs/business-os/cards"), {
      recursive: true,
    });
    await fs.mkdir(path.join(worktreePath, "docs/business-os/ideas/inbox"), {
      recursive: true,
    });
    await fs.mkdir(path.join(worktreePath, "docs/business-os/ideas/worked"), {
      recursive: true,
    });

    // Create minimal git config
    const gitConfig = `[core]
\trepositoryformatversion = 0
\tfilemode = true
\tbare = false
[remote "origin"]
\turl = https://github.com/test/repo.git
\tfetch = +refs/heads/*:refs/remotes/origin/*
[branch "work/business-os-store"]
\tremote = origin
\tmerge = refs/heads/work/business-os-store
`;
    await fs.writeFile(
      path.join(worktreePath, ".git/config"),
      gitConfig,
      "utf-8"
    );
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("isArchived", () => {
    it("returns true for archived card path", () => {
      expect(isArchived("docs/business-os/cards/archive/TEST-001.user.md")).toBe(
        true
      );
    });

    it("returns true for archived idea path", () => {
      expect(isArchived("docs/business-os/ideas/inbox/archive/idea.md")).toBe(
        true
      );
    });

    it("returns false for non-archived card path", () => {
      expect(isArchived("docs/business-os/cards/TEST-001.user.md")).toBe(false);
    });

    it("returns false for non-archived idea path", () => {
      expect(isArchived("docs/business-os/ideas/inbox/idea.md")).toBe(false);
    });
  });

  describe("filterArchived", () => {
    it("filters out archived items", () => {
      const items = [
        { filePath: "docs/business-os/cards/TEST-001.user.md" },
        { filePath: "docs/business-os/cards/archive/TEST-002.user.md" },
        { filePath: "docs/business-os/cards/TEST-003.user.md" },
      ];

      const filtered = filterArchived(items);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].filePath).toBe("docs/business-os/cards/TEST-001.user.md");
      expect(filtered[1].filePath).toBe("docs/business-os/cards/TEST-003.user.md");
    });

    it("returns all items if none are archived", () => {
      const items = [
        { filePath: "docs/business-os/cards/TEST-001.user.md" },
        { filePath: "docs/business-os/cards/TEST-002.user.md" },
      ];

      const filtered = filterArchived(items);
      expect(filtered).toHaveLength(2);
    });

    it("returns empty array if all items are archived", () => {
      const items = [
        { filePath: "docs/business-os/cards/archive/TEST-001.user.md" },
        { filePath: "docs/business-os/cards/archive/TEST-002.user.md" },
      ];

      const filtered = filterArchived(items);
      expect(filtered).toHaveLength(0);
    });
  });

  describe("archiveItem", () => {
    it("archives a card successfully", async () => {
      // Create a test card
      const cardId = "TEST-OPP-001";
      const cardPath = path.join(
        worktreePath,
        `docs/business-os/cards/${cardId}.user.md`
      );

      const cardContent = matter.stringify("# Test Card", {
        Type: "Card",
        ID: cardId,
        Status: "Dropped",
        Lane: "Inbox",
        Priority: "P3",
        Business: "TEST",
        Created: "2026-01-28",
      });

      await fs.writeFile(cardPath, cardContent, "utf-8");

      // Archive the card
      const result = await archiveItem(
        worktreePath,
        "card",
        cardId,
        CommitIdentities.user
      );

      // Check result
      if (!result.success) {
        console.error("Archive failed:", result.error);
      }
      expect(result.success).toBe(true);
      expect(result.archivedPath).toBe(
        `docs/business-os/cards/archive/${cardId}.user.md`
      );

      // Verify original file was removed
      const originalExists = await fs
        .access(cardPath)
        .then(() => true)
        .catch(() => false);
      expect(originalExists).toBe(false);

      // Verify archived file exists with updated status
      const archivedPath = path.join(worktreePath, result.archivedPath!);
      const archivedExists = await fs
        .access(archivedPath)
        .then(() => true)
        .catch(() => false);
      expect(archivedExists).toBe(true);

      if (archivedExists) {
        const archivedContent = await fs.readFile(archivedPath, "utf-8");
        const parsed = matter(archivedContent);
        expect(parsed.data.Status).toBe("Archived");
        expect(parsed.data.ID).toBe(cardId);
      }
    });

    it("archives an idea successfully", async () => {
      // Create a test idea
      const ideaFilename = "test-idea.md";
      const ideaPath = path.join(
        worktreePath,
        `docs/business-os/ideas/inbox/${ideaFilename}`
      );

      const ideaContent = matter.stringify("# Test Idea", {
        Type: "Idea",
        ID: "TEST-IDEA-001",
        Status: "raw",
        Business: "TEST",
      });

      await fs.writeFile(ideaPath, ideaContent, "utf-8");

      // Archive the idea
      const result = await archiveItem(
        worktreePath,
        "idea",
        ideaFilename,
        CommitIdentities.user,
        "inbox"
      );

      // Check result
      expect(result.success).toBe(true);
      expect(result.archivedPath).toBe(
        `docs/business-os/ideas/inbox/archive/${ideaFilename}`
      );

      // Verify archived file has updated status
      const archivedPath = path.join(worktreePath, result.archivedPath!);
      const archivedExists = await fs
        .access(archivedPath)
        .then(() => true)
        .catch(() => false);

      if (archivedExists) {
        const archivedContent = await fs.readFile(archivedPath, "utf-8");
        const parsed = matter(archivedContent);
        expect(parsed.data.Status).toBe("Archived");
      }
    });

    it("returns error for non-existent card", async () => {
      const result = await archiveItem(
        worktreePath,
        "card",
        "NONEXISTENT-001",
        CommitIdentities.user
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("File not found");
    });

    it("returns error for idea without location", async () => {
      const result = await archiveItem(
        worktreePath,
        "idea",
        "test-idea.md",
        CommitIdentities.user
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Location is required");
    });
  });
});
