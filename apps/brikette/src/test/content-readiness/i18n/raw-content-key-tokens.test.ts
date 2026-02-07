import path from "node:path";

import {
  findRawContentKeyTokens,
  formatRawContentKeyTokensSample,
} from "../helpers/rawContentKeyTokens";

describe("guide locales should not contain raw content.* placeholder tokens", () => {
  it("rejects content.* key tokens used as translated values", () => {
    const LOCALES_ROOT = path.resolve(__dirname, "../../../locales");
    const matches = findRawContentKeyTokens({ localesDir: LOCALES_ROOT });

    if (matches.length === 0) {
      expect(matches).toEqual([]);
      return;
    }

    const sample = formatRawContentKeyTokensSample(matches);
    throw new Error(
      [
        `Found ${matches.length} translation entries that still contain placeholder keys.`,
        "Translate these strings instead of leaving the `content.*` tokens as values.",
        "Sample:",
        sample,
      ].join("\n"),
    );
  });
});

