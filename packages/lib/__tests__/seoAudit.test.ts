import { jest } from "@jest/globals";

const lighthouseMock = jest.fn();
const launchMock = jest.fn();

jest.mock(
  "lighthouse",
  () => ({
    default: lighthouseMock,
  }),
  { virtual: true },
);

jest.mock(
  "chrome-launcher",
  () => ({
    default: {
      launch: launchMock,
    },
  }),
  { virtual: true },
);

jest.mock(
  "lighthouse/core/config/desktop-config.js",
  () => ({}),
  { virtual: true },
);

import { runSeoAudit } from "../src/seoAudit";

describe("runSeoAudit", () => {
  afterEach(() => {
    lighthouseMock.mockReset();
    launchMock.mockReset();
  });

  it("returns score and recommendations and closes chrome", async () => {
    const killMock = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killMock });
    lighthouseMock.mockResolvedValue({
      lhr: {
        categories: { seo: { score: 0.9 } },
        audits: {
          good: { score: 1, scoreDisplayMode: "numeric", title: "Good" },
          bad: { score: 0, scoreDisplayMode: "numeric", title: "Bad" },
          na: { score: 0, scoreDisplayMode: "notApplicable", title: "N/A" },
        },
      },
    });

    const result = await runSeoAudit("https://example.com");

    expect(result).toEqual({ score: 90, recommendations: ["Bad"] });
    expect(killMock).toHaveBeenCalled();
  });

  it("closes chrome when lighthouse throws", async () => {
    const killMock = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killMock });
    lighthouseMock.mockRejectedValue(new Error("boom"));

    await expect(runSeoAudit("https://example.com")).rejects.toThrow("boom");
    expect(killMock).toHaveBeenCalled();
  });
});

