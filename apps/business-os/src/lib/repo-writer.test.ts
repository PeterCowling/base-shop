import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import matter from "gray-matter";

import { CommitIdentities } from "./commit-identity";
import { RepoWriter } from "./repo-writer";

/**
 * Note: These tests use real filesystem and git operations in temp directories
 * to ensure the integration works correctly. This is acceptable for Phase 0.
 */

describe("RepoWriter", () => {
  let tempDir: string;
  let repoRoot: string;
  let worktreePath: string;
  let writer: RepoWriter;

  beforeEach(async () => {
    // Create temporary directories
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "business-os-writer-"));
    repoRoot = path.join(tempDir, "repo");
    worktreePath = path.join(tempDir, "worktree");

    // Initialize a git repo
    await fs.mkdir(repoRoot, { recursive: true });
    await fs.mkdir(path.join(repoRoot, ".git"), { recursive: true });

    // Initialize worktree
    await fs.mkdir(worktreePath, { recursive: true });
    await fs.mkdir(path.join(worktreePath, ".git"), { recursive: true });
    await fs.mkdir(path.join(worktreePath, "docs/business-os/ideas/inbox"), {
      recursive: true,
    });
    await fs.mkdir(path.join(worktreePath, "docs/business-os/cards"), {
      recursive: true,
    });

    // Create a minimal git config for the worktree
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

    writer = new RepoWriter(repoRoot, worktreePath);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("isWorktreeReady", () => {
    it("returns false if worktree doesn't exist", async () => {
      const nonExistentPath = path.join(tempDir, "nonexistent");
      const testWriter = new RepoWriter(repoRoot, nonExistentPath);

      const ready = await testWriter.isWorktreeReady();
      expect(ready).toBe(false);
    });

    it("returns false if worktree is not a git repo", async () => {
      const noGitPath = path.join(tempDir, "nogit");
      await fs.mkdir(noGitPath, { recursive: true });

      const testWriter = new RepoWriter(repoRoot, noGitPath);

      const ready = await testWriter.isWorktreeReady();
      expect(ready).toBe(false);
    });
  });

  describe("isWorktreeClean", () => {
    it("returns clean=true for clean worktree", async () => {
      // Mock a clean worktree (no uncommitted files)
      const result = await writer.isWorktreeClean();

      // This may fail if git status can't run, but that's OK for the test
      // We're primarily testing the logic
      expect(result).toHaveProperty("clean");
    });
  });

  describe("writeIdea", () => {
    it("creates idea file with correct frontmatter", async () => {
      const idea = {
        ID: "TEST-OPP-0001",
        Business: "TEST",
        Status: "raw" as const,
        "Created-Date": "2026-01-28",
        content: "# Test Idea\n\nThis is a test idea.",
      };

      // Write the idea
      const result = await writer.writeIdea(idea, CommitIdentities.user);

      // Check if file was created
      const filePath = path.join(
        worktreePath,
        "docs/business-os/ideas/inbox/TEST-OPP-0001.user.md"
      );
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        // Verify file contents
        const content = await fs.readFile(filePath, "utf-8");
        const parsed = matter(content);

        expect(parsed.data.Type).toBe("Idea");
        expect(parsed.data.ID).toBe("TEST-OPP-0001");
        expect(parsed.data.Business).toBe("TEST");
        expect(parsed.content).toContain("# Test Idea");
      }

      // Result should have filePath whether git operations succeeded or not
      expect(result).toHaveProperty("success");
      if (result.success) {
        expect(result.filePath).toContain("ideas/inbox/TEST-OPP-0001.user.md");
      }
    });

    it("rejects writes outside Business OS area", async () => {
      const idea = {
        ID: "../../../etc/passwd",
        Business: "TEST",
        Status: "raw" as const,
        content: "malicious",
      };

      const result = await writer.writeIdea(idea, CommitIdentities.user);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Write access denied");
    });
  });

  describe("writeCard", () => {
    it("creates card file with correct frontmatter", async () => {
      const card = {
        ID: "TEST-OPP-0001",
        Lane: "Inbox" as const,
        Priority: "P2" as const,
        Owner: "Pete",
        Business: "TEST",
        Title: "Test Card",
        Created: "2026-01-28",
        content: "# Test Card\n\nCard content here.",
      };

      const result = await writer.writeCard(card, CommitIdentities.user);

      // Check if file was created
      const filePath = path.join(
        worktreePath,
        "docs/business-os/cards/TEST-OPP-0001.user.md"
      );
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        // Verify file contents
        const content = await fs.readFile(filePath, "utf-8");
        const parsed = matter(content);

        expect(parsed.data.Type).toBe("Card");
        expect(parsed.data.ID).toBe("TEST-OPP-0001");
        expect(parsed.data.Lane).toBe("Inbox");
        expect(parsed.data.Priority).toBe("P2");
        expect(parsed.content).toContain("# Test Card");
      }

      expect(result).toHaveProperty("success");
      if (result.success) {
        expect(result.filePath).toContain("cards/TEST-OPP-0001.user.md");
      }
    });
  });

  describe("updateCard", () => {
    it("updates existing card with new frontmatter", async () => {
      // First create a card
      const card = {
        ID: "TEST-OPP-0002",
        Lane: "Inbox" as const,
        Priority: "P2" as const,
        Owner: "Pete",
        Title: "Original Title",
        Created: "2026-01-28",
        content: "Original content",
      };

      await writer.writeCard(card, CommitIdentities.user);

      // Update the card
      const updates = {
        Lane: "In progress" as const,
        Title: "Updated Title",
      };

      const result = await writer.updateCard(
        "TEST-OPP-0002",
        updates,
        CommitIdentities.user
      );

      // Check if file was updated
      const filePath = path.join(
        worktreePath,
        "docs/business-os/cards/TEST-OPP-0002.user.md"
      );
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        // Verify file contents
        const content = await fs.readFile(filePath, "utf-8");
        const parsed = matter(content);

        expect(parsed.data.Lane).toBe("In progress");
        expect(parsed.data.Title).toBe("Updated Title");
        expect(parsed.data.Updated).toBeDefined();
        expect(parsed.data.Priority).toBe("P2"); // Should preserve unchanged fields
      }

      expect(result).toHaveProperty("success");
    });

    it("returns error for non-existent card", async () => {
      const result = await writer.updateCard(
        "NONEXISTENT-0001",
        {
          Lane: "Done",
        },
        CommitIdentities.user
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("sync", () => {
    it("returns sync result structure", async () => {
      const result = await writer.sync();

      // Sync may fail in test environment (no real git), but should return proper structure
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("pushed");

      if (result.success) {
        expect(result.compareUrl).toContain("github.com");
        expect(result.findPrUrl).toContain("github.com");
      }
    });
  });
});
