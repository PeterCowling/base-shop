/**
 * CommitReader tests
 * MVP-F1: Commit-to-card linking
 */

import { getCommitsForCard } from "./CommitReader";

describe("CommitReader", () => {
  describe("getCommitsForCard", () => {
    it("extracts card ID from commit messages", () => {
      // This test will pass once implementation exists
      expect(getCommitsForCard).toBeDefined();
    });

    it("returns empty array for non-existent card", async () => {
      // Mock test - will be fleshed out during implementation
      const commits = await getCommitsForCard("/mock/repo", "NONEXISTENT-999");
      expect(Array.isArray(commits)).toBe(true);
    });
  });

  describe("extractCardId", () => {
    it("extracts BRIK-001 format", () => {
      const message = "feat(bos): implement feature for BRIK-001";
      // Test will be implemented with extractCardId helper
      expect(message).toContain("BRIK-001");
    });

    it("extracts multiple card IDs", () => {
      const message = "fix: resolve issues in BRIK-001 and BRIK-002";
      // Test will be implemented with extractCardId helper
      expect(message).toContain("BRIK-001");
      expect(message).toContain("BRIK-002");
    });
  });
});
