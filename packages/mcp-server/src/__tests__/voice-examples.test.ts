/** @jest-environment node */

import { readFile } from "fs/promises";

import {
  clearVoiceExamplesCache,
  handleVoiceExamplesRead,
} from "../resources/voice-examples";

jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
}));

const readFileMock = readFile as jest.Mock;

describe("voice-examples resource", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    clearVoiceExamplesCache();
  });

  it("TC-01: loads and caches", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({ scenarios: { faq: { good_examples: ["A"] } } })
    );

    await handleVoiceExamplesRead();
    await handleVoiceExamplesRead();

    expect(readFileMock).toHaveBeenCalledTimes(1);
  });

  it("TC-02/03/04: scenarios include examples and phrases", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({
        scenarios: {
          faq: {
            good_examples: ["A"],
            bad_examples: ["B"],
            phrases_to_avoid: ["C"],
            preferred_phrases: ["D"],
            attribution: { scenario: "faq", tone: "friendly" },
          },
          policy: {
            good_examples: ["A"],
            bad_examples: ["B"],
            phrases_to_avoid: ["C"],
            preferred_phrases: ["D"],
            attribution: { scenario: "policy", tone: "clear" },
          },
          payment: {
            good_examples: ["A"],
            bad_examples: ["B"],
            phrases_to_avoid: ["C"],
            preferred_phrases: ["D"],
            attribution: { scenario: "payment", tone: "firm" },
          },
          cancellation: {
            good_examples: ["A"],
            bad_examples: ["B"],
            phrases_to_avoid: ["C"],
            preferred_phrases: ["D"],
            attribution: { scenario: "cancellation", tone: "direct" },
          },
          complaint: {
            good_examples: ["A"],
            bad_examples: ["B"],
            phrases_to_avoid: ["C"],
            preferred_phrases: ["D"],
            attribution: { scenario: "complaint", tone: "empathetic" },
          },
        },
      })
    );

    const result = await handleVoiceExamplesRead();
    const payload = JSON.parse(result.contents[0].text);
    expect(payload.scenarios.faq.good_examples.length).toBeGreaterThan(0);
    expect(payload.scenarios.policy.phrases_to_avoid.length).toBeGreaterThan(0);
    expect(payload.scenarios.payment.attribution.tone).toBe("firm");
  });
});
