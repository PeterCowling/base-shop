/**
 * Tests for progress-notifier
 * MVP-F2: Auto-progress notes
 */

import { extractCardIds } from "../lib/repo/CommitReader";

import { createProgressComment, formatProgressMessage } from "./progress-notifier";

describe("progress-notifier", () => {
  describe("formatProgressMessage", () => {
    it("formats message with action, files, and commit hash", () => {
      const message = formatProgressMessage(
        "work-idea",
        ["idea-1.md", "card-2.md"],
        "abc123"
      );

      expect(message).toContain("Agent completed: work-idea");
      expect(message).toContain("Files changed: idea-1.md, card-2.md");
      expect(message).toContain("Commit: abc123");
    });

    it("handles single file", () => {
      const message = formatProgressMessage("fact-find", ["card.md"], "def456");

      expect(message).toContain("Files changed: card.md");
    });

    it("handles many files", () => {
      const files = Array.from({ length: 5 }, (_, i) => `file-${i}.md`);
      const message = formatProgressMessage("build-feature", files, "xyz789");

      expect(message).toContain("Files changed: 5 files");
    });
  });

  describe("createProgressComment", () => {
    it("exports createProgressComment function", () => {
      expect(typeof createProgressComment).toBe("function");
    });
  });

  describe("extractCardIds integration", () => {
    it("extracts card IDs from commit message", () => {
      const message = "agent: work-idea for BRIK-001\n\nTask ID: xyz";
      const cardIds = extractCardIds(message);

      expect(cardIds).toEqual(["BRIK-001"]);
    });

    it("extracts multiple card IDs", () => {
      const message = "feat: implement BRIK-001 and PLAT-002";
      const cardIds = extractCardIds(message);

      expect(cardIds).toEqual(["BRIK-001", "PLAT-002"]);
    });
  });
});
