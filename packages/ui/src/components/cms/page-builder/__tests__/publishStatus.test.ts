import { describe, expect, it } from "@jest/globals";
import { derivePublishState } from "../state/publishStatus";

describe("derivePublishState", () => {
  it("returns draft when status is draft", () => {
    expect(
      derivePublishState({ status: "draft", updatedAt: "2025-01-01", publishedAt: "2025-01-02" }),
    ).toBe("draft");
  });

  it("returns published when publishedAt is newer or equal", () => {
    expect(
      derivePublishState({ status: "published", updatedAt: "2025-01-02", publishedAt: "2025-01-02" }),
    ).toBe("published");
  });

  it("returns changed when revision ids differ", () => {
    expect(
      derivePublishState({
        status: "published",
        publishedAt: "2025-01-01",
        updatedAt: "2025-01-02",
        publishedRevisionId: "rev-a",
        currentRevisionId: "rev-b",
      }),
    ).toBe("changed");
  });

  it("returns changed when published revision is missing but updatedAt is after publishedAt", () => {
    expect(
      derivePublishState({
        status: "published",
        publishedAt: "2025-01-01",
        updatedAt: "2025-02-01",
        currentRevisionId: "rev-c",
      }),
    ).toBe("changed");
  });

  it("returns changed when updatedAt is after publishedAt", () => {
    expect(
      derivePublishState({ status: "published", updatedAt: "2025-02-01", publishedAt: "2025-01-01" }),
    ).toBe("changed");
  });

  it("returns published when publishedAt missing but status published", () => {
    expect(derivePublishState({ status: "published" })).toBe("published");
  });
});
