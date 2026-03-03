import { describe, expect, it } from "@jest/globals";

import { DEFAULT_SOURCE_ROOTS } from "../cass-retrieve.js";

describe("DEFAULT_SOURCE_ROOTS", () => {
  it("TC-02-01: includes docs/business-os/strategy", () => {
    expect(DEFAULT_SOURCE_ROOTS).toContain("docs/business-os/strategy");
  });

  it("TC-02-02: includes all 3 original roots (regression guard)", () => {
    expect(DEFAULT_SOURCE_ROOTS).toContain("docs/plans");
    expect(DEFAULT_SOURCE_ROOTS).toContain("docs/business-os/startup-loop");
    expect(DEFAULT_SOURCE_ROOTS).toContain(".claude/skills");
  });

  it("TC-02-03: has exactly 4 entries (prevents silent additions)", () => {
    expect(DEFAULT_SOURCE_ROOTS).toHaveLength(4);
  });
});
