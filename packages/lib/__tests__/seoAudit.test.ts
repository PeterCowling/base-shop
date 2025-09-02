import { jest } from "@jest/globals";

const lighthouseMock = jest.fn();
const launchMock = jest.fn();

jest.mock(
  "lighthouse",
  () => ({
    __esModule: true,
    default: lighthouseMock,
  }),
  { virtual: true },
);

jest.mock(
  "chrome-launcher",
  () => ({
    __esModule: true,
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
    const killSpy = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
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
    expect(killSpy).toHaveBeenCalled();
  });

  it("throws when lighthouse returns no result and closes chrome", async () => {
    const killSpy = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
    lighthouseMock.mockResolvedValue(undefined);

    await expect(runSeoAudit("https://example.com")).rejects.toThrow(
      "Lighthouse did not return a result",
    );
    expect(killSpy).toHaveBeenCalled();
  });
});

