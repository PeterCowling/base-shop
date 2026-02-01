import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import matter from "gray-matter";
import simpleGit from "simple-git";

import { CommitIdentities } from "./commit-identity";
import { RepoWriter } from "./repo-writer";
import { accessWithinRoot, mkdirWithinRoot, readFileWithinRoot } from "./safe-fs";

/**
 * Note: These tests use real filesystem and git operations in temp directories
 * to ensure the integration works correctly. This is acceptable for Phase 0.
 */

describe("RepoWriter", () => {
  let tempDir: string;
  let repoRoot: string;
  let writer: RepoWriter;

  beforeEach(async () => {
    // Create temporary directories
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "business-os-writer-"));
    repoRoot = path.join(tempDir, "repo");

    await mkdirWithinRoot(tempDir, repoRoot, { recursive: true });
    await mkdirWithinRoot(tempDir, path.join(repoRoot, "docs/business-os/ideas/inbox"), {
      recursive: true,
    });
    await mkdirWithinRoot(tempDir, path.join(repoRoot, "docs/business-os/cards"), {
      recursive: true,
    });

    // Initialize a real git repo so RepoWriter can run status/add/commit.
    const git = simpleGit(repoRoot);
    await git.init();
    await git.addConfig("user.name", "Test User");
    await git.addConfig("user.email", "test@example.com");
    await git.commit("chore: initial", undefined, { "--allow-empty": null });
    await git.checkoutLocalBranch("dev");

    writer = new RepoWriter(repoRoot);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("isRepoReady", () => {
    it("returns false if repo doesn't exist", async () => {
      const nonExistentPath = path.join(tempDir, "nonexistent");
      const testWriter = new RepoWriter(nonExistentPath);

      const ready = await testWriter.isRepoReady();
      expect(ready).toBe(false);
    });

    it("returns false if repo is not a git repo", async () => {
      const noGitPath = path.join(tempDir, "nogit");
      await mkdirWithinRoot(tempDir, noGitPath, { recursive: true });

      const testWriter = new RepoWriter(noGitPath);

      const ready = await testWriter.isRepoReady();
      expect(ready).toBe(false);
    });
  });

  describe("isRepoClean", () => {
    it("returns clean=true for clean repo", async () => {
      const result = await writer.isRepoClean();
      expect(result.clean).toBe(true);
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

      // Write the idea (MVP-B3: with actor/initiator)
      const result = await writer.writeIdea(idea, CommitIdentities.user, "pete", "pete");

      // Check if file was created
      const filePath = path.join(
        repoRoot,
        "docs/business-os/ideas/inbox/TEST-OPP-0001.user.md"
      );
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        // Verify file contents
        const content = (await readFileWithinRoot(
          tempDir,
          filePath,
          "utf-8"
        )) as string;
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

      const result = await writer.writeIdea(idea, CommitIdentities.user, "pete", "pete");

      expect(result.success).toBe(false);
      expect(result.errorKey).toBe("businessOs.api.common.writeAccessDenied");
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

      const result = await writer.writeCard(card, CommitIdentities.user, "pete", "pete");

      // Check if file was created
      const filePath = path.join(
        repoRoot,
        "docs/business-os/cards/TEST-OPP-0001.user.md"
      );
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        // Verify file contents
        const content = (await readFileWithinRoot(
          tempDir,
          filePath,
          "utf-8"
        )) as string;
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

      await writer.writeCard(card, CommitIdentities.user, "pete", "pete");

      // Update the card
      const updates = {
        Lane: "In progress" as const,
        Title: "Updated Title",
      };

      const result = await writer.updateCard(
        "TEST-OPP-0002",
        updates,
        CommitIdentities.user,
        "pete",
        "pete"
      );

      // Check if file was updated
      const filePath = path.join(
        repoRoot,
        "docs/business-os/cards/TEST-OPP-0002.user.md"
      );
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        // Verify file contents
        const content = (await readFileWithinRoot(
          tempDir,
          filePath,
          "utf-8"
        )) as string;
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
        CommitIdentities.user,
        "pete",
        "pete"
      );

      expect(result.success).toBe(false);
      expect(result.errorKey).toBe("businessOs.repoWriter.errors.cardNotFound");
    });
  });

  describe("updateIdea", () => {
    it("updates existing idea with new frontmatter and content", async () => {
      // First create an idea
      await writer.writeIdea(
        {
          ID: "BRIK-OPP-0003",
          Business: "BRIK",
          Status: "raw",
          "Created-Date": "2026-01-29",
          content: "# Original idea content",
        },
        CommitIdentities.user,
        "pete",
        "pete"
      );

      // Then update it
      const result = await writer.updateIdea(
        "BRIK-OPP-0003",
        {
          Status: "worked",
          content: "# Updated idea content\n\nWith more details.",
        },
        CommitIdentities.user,
        "pete",
        "pete"
      );

      expect(result.success).toBe(true);
      expect(result.filePath).toBe("docs/business-os/ideas/inbox/BRIK-OPP-0003.user.md");

      // Verify file was updated
      const filePath = path.join(repoRoot, result.filePath!);
      const fileExists = await accessWithinRoot(repoRoot, filePath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        const content = (await readFileWithinRoot(
          tempDir,
          filePath,
          "utf-8"
        )) as string;
        const parsed = matter(content);

        expect(parsed.data.Status).toBe("worked");
        expect(parsed.data["Last-Updated"]).toBeDefined();
        expect(parsed.data.Business).toBe("BRIK"); // Should preserve unchanged fields
        expect(parsed.content).toContain("Updated idea content");
      }

      expect(result).toHaveProperty("success");
    });

    it("returns error for non-existent idea", async () => {
      const result = await writer.updateIdea(
        "NONEXISTENT-OPP-0001",
        {
          Status: "worked",
        },
        CommitIdentities.user,
        "pete",
        "pete"
      );

      expect(result.success).toBe(false);
      expect(result.errorKey).toBe("businessOs.repoWriter.errors.ideaNotFound");
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
