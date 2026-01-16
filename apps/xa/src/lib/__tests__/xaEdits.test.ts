import { describe, expect, it } from "@jest/globals";

import { XA_EDITS } from "../xaEdits";

describe("xaEdits", () => {
  it("exposes curated edit groups", () => {
    expect(XA_EDITS.length).toBeGreaterThan(0);
    for (const edit of XA_EDITS) {
      expect(edit.slug).toBeTruthy();
      expect(edit.productSlugs.length).toBeGreaterThan(0);
    }
  });
});
