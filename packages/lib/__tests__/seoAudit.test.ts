import { jest } from "@jest/globals";

const lighthouseMock = jest.fn();
const launchMock = jest.fn();

const lighthouseModule: any = { __esModule: true, default: lighthouseMock };
const chromeModule: any = {
  __esModule: true,
  default: { launch: launchMock },
};

jest.mock("lighthouse", () => lighthouseModule, { virtual: true });

jest.mock("chrome-launcher", () => chromeModule, { virtual: true });

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
    chromeModule.default.launch = launchMock;
    lighthouseModule.default = lighthouseMock;
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

  it("throws when chrome-launcher launch function is not available", async () => {
    chromeModule.default = {};

    await expect(runSeoAudit("https://example.com")).rejects.toThrow(
      "chrome-launcher launch function not available",
    );
  });

  it("throws when lighthouse import is not a function", async () => {
    lighthouseModule.default = {};
    chromeModule.default.launch = launchMock;

    await expect(runSeoAudit("https://example.com")).rejects.toThrow(
      "lighthouse is not a function",
    );
  });
});

