import { describe, expect, it } from "@jest/globals";

import { getGitHubHistoryUrl } from "./git-history";

describe("git-history", () => {
  describe("getGitHubHistoryUrl", () => {
    it("should generate correct GitHub URL with default owner/repo", () => {
      const url = getGitHubHistoryUrl("docs/business-os/cards/TEST-001.user.md");
      expect(url).toBe(
        "https://github.com/PeterCowling/base-shop/commits/main/docs%2Fbusiness-os%2Fcards%2FTEST-001.user.md"
      );
    });

    it("should generate correct GitHub URL with custom owner/repo", () => {
      const url = getGitHubHistoryUrl(
        "docs/business-os/cards/TEST-001.user.md",
        "custom-owner",
        "custom-repo"
      );
      expect(url).toBe(
        "https://github.com/custom-owner/custom-repo/commits/main/docs%2Fbusiness-os%2Fcards%2FTEST-001.user.md"
      );
    });

    it("should properly encode file path with special characters", () => {
      const url = getGitHubHistoryUrl("path/with spaces/file.md");
      expect(url).toContain("path%2Fwith%20spaces%2Ffile.md");
    });
  });
});
