/** @jest-environment node */

import { readFile } from "fs/promises";

import { clearDraftGuideCache, handleDraftGuideRead } from "../resources/draft-guide";

jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
}));

const readFileMock = readFile as jest.Mock;

describe("draft-guide resource", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    clearDraftGuideCache();
  });

  it("TC-01: loads and caches", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({ length_calibration: { faq: { min_words: 50, max_words: 100 } } })
    );

    await handleDraftGuideRead();
    await handleDraftGuideRead();

    expect(readFileMock).toHaveBeenCalledTimes(1);
  });

  it("TC-02/03/04: guide structure present", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({
        length_calibration: { faq: { min_words: 50, max_words: 100 } },
        content_rules: { always: ["A"], if: ["B"], never: ["C"] },
        information_order: ["Direct answer"],
        format_decision_tree: ["If multiple questions, use numbered list."],
        tone_triggers: { payment: "Firm" },
        quality_checklist: ["All questions answered"],
      })
    );

    const result = await handleDraftGuideRead();
    const payload = JSON.parse(result.contents[0].text);
    expect(payload.length_calibration.faq).toBeDefined();
    expect(payload.content_rules.always).toBeDefined();
    expect(payload.content_rules.never).toBeDefined();
  });
});
