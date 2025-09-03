import { jest } from "@jest/globals";

const lighthouseMock = jest.fn();
const launchMock = jest.fn();

let lighthouseModule: any;
let chromeModule: any;

jest.mock("lighthouse", () => lighthouseModule, { virtual: true });

jest.mock("chrome-launcher", () => chromeModule, { virtual: true });

jest.mock(
  "lighthouse/core/config/desktop-config.js",
  () => ({}),
  { virtual: true },
);

async function loadRunSeoAudit() {
  const mod = await import("../src/seoAudit");
  return mod.runSeoAudit;
}

describe("runSeoAudit", () => {
  beforeEach(() => {
    jest.resetModules();
    lighthouseMock.mockReset();
    launchMock.mockReset();
    lighthouseModule = { __esModule: true, default: lighthouseMock };
    chromeModule = { __esModule: true, default: { launch: launchMock } };
  });

  const successResponse = {
    lhr: {
      categories: { seo: { score: 0.9 } },
      audits: {
        good: { score: 1, scoreDisplayMode: "numeric", title: "Good" },
        bad: { score: 0, scoreDisplayMode: "numeric", title: "Bad" },
        na: { score: 0, scoreDisplayMode: "notApplicable", title: "N/A" },
      },
    },
  };

  it("returns score and recommendations and closes chrome", async () => {
    const killSpy = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
    lighthouseMock.mockResolvedValue(successResponse);

    const runSeoAudit = await loadRunSeoAudit();
    const result = await runSeoAudit("https://example.com");

    expect(result).toEqual({ score: 90, recommendations: ["Bad"] });
    expect(killSpy).toHaveBeenCalled();
  });

  it("throws when lighthouse returns no result and closes chrome", async () => {
    const killSpy = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
    lighthouseMock.mockResolvedValue(undefined);

    const runSeoAudit = await loadRunSeoAudit();
    await expect(runSeoAudit("https://example.com")).rejects.toThrow(
      "Lighthouse did not return a result",
    );
    expect(killSpy).toHaveBeenCalled();
  });

  it("throws when chrome-launcher launch function is not available", async () => {
    chromeModule.default = {};

    const runSeoAudit = await loadRunSeoAudit();
    await expect(runSeoAudit("https://example.com")).rejects.toThrow(
      "chrome-launcher launch function not available",
    );
  });

  it("throws when lighthouse import is not a function", async () => {
    lighthouseModule.default = {};
    chromeModule.default.launch = launchMock;

    const runSeoAudit = await loadRunSeoAudit();
    await expect(runSeoAudit("https://example.com")).rejects.toThrow(
      "lighthouse is not a function",
    );
  });

  it("supports lighthouse exported as default.default", async () => {
    lighthouseModule.default = { default: lighthouseMock };
    const killSpy = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
    lighthouseMock.mockResolvedValue(successResponse);

    const runSeoAudit = await loadRunSeoAudit();
    const result = await runSeoAudit("https://example.com");

    expect(result).toEqual({ score: 90, recommendations: ["Bad"] });
    expect(killSpy).toHaveBeenCalled();
  });

  it("supports lighthouse module being a function", async () => {
    lighthouseModule = lighthouseMock;
    const killSpy = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
    lighthouseMock.mockResolvedValue(successResponse);

    const runSeoAudit = await loadRunSeoAudit();
    const result = await runSeoAudit("https://example.com");

    expect(result).toEqual({ score: 90, recommendations: ["Bad"] });
    expect(killSpy).toHaveBeenCalled();
  });

  it("supports chrome-launcher exporting launch directly", async () => {
    chromeModule = { __esModule: true, launch: launchMock };
    const killSpy = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
    lighthouseMock.mockResolvedValue(successResponse);

    const runSeoAudit = await loadRunSeoAudit();
    const result = await runSeoAudit("https://example.com");

    expect(result).toEqual({ score: 90, recommendations: ["Bad"] });
    expect(killSpy).toHaveBeenCalled();
  });

  it("supports chrome-launcher exporting launch via default.default", async () => {
    chromeModule.default = { default: { launch: launchMock } };
    const killSpy = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
    lighthouseMock.mockResolvedValue(successResponse);

    const runSeoAudit = await loadRunSeoAudit();
    const result = await runSeoAudit("https://example.com");

    expect(result).toEqual({ score: 90, recommendations: ["Bad"] });
    expect(killSpy).toHaveBeenCalled();
  });
});
