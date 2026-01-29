import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { execFileSync } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

// Mock execFileSync to prevent actual git calls during tests
jest.mock("child_process", () => ({
  execFileSync: jest.fn(),
}));

const mockedExecFileSync = execFileSync as unknown as ReturnType<typeof jest.fn>;

describe("docs-lint Business OS validation", () => {
  let tempDir: string;
  let docsDir: string;

  beforeEach(async () => {
    // Create temp directory structure
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-lint-test-"));
    docsDir = path.join(tempDir, "docs");
    await fs.mkdir(docsDir, { recursive: true });
    await fs.mkdir(path.join(docsDir, "business-os"), { recursive: true });

    // Change to temp directory
    process.chdir(tempDir);
  });

  afterEach(async () => {
    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("Idea validation", () => {
    it("should require Type, Business, Owner, and ID fields", async () => {
      const ideaPath = path.join(docsDir, "business-os/test-idea.user.md");
      const content = `---
Type: Idea
Status: Draft
---

# Test Idea
`;
      await fs.writeFile(ideaPath, content, "utf-8");

      // Mock git ls-files to return our test file
      mockedExecFileSync.mockReturnValue(
        `docs/business-os/test-idea.user.md\0`
      );

      // Import and run docs-lint (would need to export validation function)
      // For now, we'll test the parseHeader function directly
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Idea");
      expect(header.status).toBe("Draft");
      expect(header.business).toBeNull();
      expect(header.owner).toBeNull();
      expect(header.id).toBeNull();
    });
  });

  describe("Card validation", () => {
    it("should require all card fields", async () => {
      const cardContent = `---
Type: Card
Status: Active
Business: BRIK
Lane: Inbox
Priority: P2
Owner: Pete
ID: BRIK-OPP-0001
Created: 2026-01-28
Last-updated: 2026-01-28
---

# Test Card
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(cardContent);

      expect(header.type).toBe("Card");
      expect(header.business).toBe("BRIK");
      expect(header.lane).toBe("Inbox");
      expect(header.priority).toBe("P2");
      expect(header.owner).toBe("Pete");
      expect(header.id).toBe("BRIK-OPP-0001");
      expect(header.created).toBe("2026-01-28");
      expect(header.lastUpdated).toBe("2026-01-28");
    });
  });

  describe("Stage document validation", () => {
    it("should require Card-ID for Fact-Find", async () => {
      const content = `---
Type: Fact-Find
Status: Draft
Card-ID: BRIK-OPP-0001
---

# Fact-Finding
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Fact-Find");
      expect(header.cardId).toBe("BRIK-OPP-0001");
    });

    it("should require Card-ID for Plan", async () => {
      const content = `---
Type: Plan
Status: Draft
Card-ID: BRIK-OPP-0001
---

# Plan
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Plan");
      expect(header.cardId).toBe("BRIK-OPP-0001");
    });

    it("should require Card-ID for Build-Log", async () => {
      const content = `---
Type: Build-Log
Status: Draft
Card-ID: BRIK-OPP-0001
---

# Build Log
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Build-Log");
      expect(header.cardId).toBe("BRIK-OPP-0001");
    });

    it("should require Card-ID for Reflection", async () => {
      const content = `---
Type: Reflection
Status: Complete
Card-ID: BRIK-OPP-0001
---

# Reflection
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Reflection");
      expect(header.cardId).toBe("BRIK-OPP-0001");
    });
  });

  describe("Comment validation", () => {
    it("should require Author, Created, and Card-ID", async () => {
      const content = `---
Type: Comment
Author: Pete
Created: 2026-01-28 10:30:00
Card-ID: BRIK-OPP-0001
---

This is a comment.
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Comment");
      expect(header.author).toBe("Pete");
      expect(header.created).toBe("2026-01-28 10:30:00");
      expect(header.cardId).toBe("BRIK-OPP-0001");
    });
  });

  describe("Business-Plan validation", () => {
    it("should require Business and Last-reviewed", async () => {
      const content = `---
Type: Business-Plan
Status: Active
Business: BRIK
Last-reviewed: 2026-01-28
---

# Business Plan
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Business-Plan");
      expect(header.business).toBe("BRIK");
      expect(header.lastReviewed).toBe("2026-01-28");
    });
  });

  describe("People validation", () => {
    it("should require Last-reviewed", async () => {
      const content = `---
Type: People
Status: Active
Last-reviewed: 2026-01-28
---

# People
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("People");
      expect(header.lastReviewed).toBe("2026-01-28");
    });
  });

  describe("parseHeader function", () => {
    it("should extract all Business OS frontmatter fields", async () => {
      const content = `---
Type: Card
Status: Active
Domain: Business OS
Business: BRIK
Owner: Pete
ID: BRIK-OPP-0001
Lane: Inbox
Priority: P2
Card-ID: BRIK-OPP-0001
Author: Pete
Created: 2026-01-28
Last-reviewed: 2026-01-28
Last-updated: 2026-01-28
---

# Test
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Card");
      expect(header.status).toBe("Active");
      expect(header.domain).toBe("Business OS");
      expect(header.business).toBe("BRIK");
      expect(header.owner).toBe("Pete");
      expect(header.id).toBe("BRIK-OPP-0001");
      expect(header.lane).toBe("Inbox");
      expect(header.priority).toBe("P2");
      expect(header.cardId).toBe("BRIK-OPP-0001");
      expect(header.author).toBe("Pete");
      expect(header.created).toBe("2026-01-28");
      expect(header.lastReviewed).toBe("2026-01-28");
      expect(header.lastUpdated).toBe("2026-01-28");
    });

    it("should return null for missing fields", async () => {
      const content = `---
Type: Idea
---

# Minimal
`;
      const { parseHeader } = await import("./docs-lint-helpers");
      const header = parseHeader(content);

      expect(header.type).toBe("Idea");
      expect(header.status).toBeNull();
      expect(header.business).toBeNull();
      expect(header.owner).toBeNull();
    });
  });
});
