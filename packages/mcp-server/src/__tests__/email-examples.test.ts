/** @jest-environment node */

import { readFile } from "fs/promises";

import {
  clearEmailExamplesCache,
  handleEmailExamplesRead,
} from "../resources/email-examples";

jest.mock("../utils/data-root", () => ({
  DATA_ROOT: "/mock/data",
  BRIKETTE_ROOT: "/mock/brikette",
}));

jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
}));

const readFileMock = readFile as jest.Mock;

describe("email-examples resource", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    clearEmailExamplesCache();
  });

  it("TC-01: loads and caches", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({
        examples: [
          {
            id: "faq-1",
            category: "faq",
            subject: "Question",
            body: "Body",
            classification_reason: "FAQ",
            is_ambiguous: false,
          },
        ],
      })
    );

    await handleEmailExamplesRead();
    await handleEmailExamplesRead();

    expect(readFileMock).toHaveBeenCalledTimes(1);
  });

  it("TC-02/03/04: examples cover categories with reasoning", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({
        examples: [
          {
            id: "faq-1",
            category: "faq",
            subject: "Q",
            body: "B",
            classification_reason: "FAQ",
            is_ambiguous: false,
          },
          {
            id: "policy-1",
            category: "policy",
            subject: "Q",
            body: "B",
            classification_reason: "Policy",
            is_ambiguous: false,
          },
          {
            id: "payment-1",
            category: "payment",
            subject: "Q",
            body: "B",
            classification_reason: "Payment",
            is_ambiguous: false,
          },
          {
            id: "cancellation-1",
            category: "cancellation",
            subject: "Q",
            body: "B",
            classification_reason: "Cancellation",
            is_ambiguous: false,
          },
          {
            id: "complaint-1",
            category: "complaint",
            subject: "Q",
            body: "B",
            classification_reason: "Complaint",
            is_ambiguous: false,
          },
          {
            id: "multi-1",
            category: "multi-question",
            subject: "Q",
            body: "B",
            classification_reason: "Multiple questions",
            is_ambiguous: true,
          },
        ],
      })
    );

    const result = await handleEmailExamplesRead();
    const payload = JSON.parse(result.contents[0].text);

    const categories = new Set(payload.examples.map((ex: { category: string }) => ex.category));
    expect(categories.has("faq")).toBe(true);
    expect(categories.has("policy")).toBe(true);
    expect(categories.has("payment")).toBe(true);
    expect(categories.has("cancellation")).toBe(true);
    expect(categories.has("complaint")).toBe(true);
    expect(categories.has("multi-question")).toBe(true);

    const ambiguous = payload.examples.find(
      (ex: { is_ambiguous: boolean }) => ex.is_ambiguous
    );
    expect(ambiguous.classification_reason.length).toBeGreaterThan(0);
  });
});
