import { jest } from "@jest/globals";

type MockFn = jest.Mock & { mockResolvedValue: (v: any) => void };
const lighthouseMock = jest.fn() as unknown as MockFn;
const launchMock = jest.fn() as unknown as MockFn;

let lighthouseModule: any;
let chromeModule: any;
let desktopConfigModule: any;

jest.mock("lighthouse", () => lighthouseModule, { virtual: true });

jest.mock("chrome-launcher", () => chromeModule, { virtual: true });

jest.mock(
  "lighthouse/core/config/desktop-config.js",
  () =>
    typeof desktopConfigModule === "function"
      ? desktopConfigModule()
      : desktopConfigModule,
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
    desktopConfigModule = {};
  });

  const baseAudits = {
    good: { score: 1, scoreDisplayMode: "numeric", title: "Good" },
    bad: { score: 0, scoreDisplayMode: "numeric", title: "Bad" },
    na: { score: 0, scoreDisplayMode: "notApplicable", title: "N/A" },
  };

  const createResponse = (
    score: number,
    audits: Record<string, any> = baseAudits,
  ) => ({
    lhr: {
      categories: { seo: { score } },
      audits,
    },
  });

  it.each([
    { category: 0.9, expected: 90 },
    { category: 0.7, expected: 70 },
    { category: 0.3, expected: 30 },
  ])(
    "returns numeric score for category $category",
    async ({ category, expected }) => {
      const killSpy = jest.fn();
      launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
      lighthouseMock.mockResolvedValue(createResponse(category));

      const runSeoAudit = await loadRunSeoAudit();
      const result = await runSeoAudit("https://example.com");

      expect(result).toEqual({ score: expected, recommendations: ["Bad"] });
      expect(killSpy).toHaveBeenCalled();
    },
  );

  it("returns failing audits in lighthouse order", async () => {
    const killSpy = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
    lighthouseMock.mockResolvedValue(
      createResponse(0.3, {
        title: { score: 0, scoreDisplayMode: "numeric", title: "Title" },
        description: {
          score: 0,
          scoreDisplayMode: "numeric",
          title: "Description",
        },
        lang: { score: 0, scoreDisplayMode: "numeric", title: "Lang" },
        canonical: {
          score: 0,
          scoreDisplayMode: "numeric",
          title: "Canonical",
        },
      }),
    );

    const runSeoAudit = await loadRunSeoAudit();
    const result = await runSeoAudit("https://example.com");

    expect(result.recommendations).toEqual([
      "Title",
      "Description",
      "Lang",
      "Canonical",
    ]);
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

  it("throws when lighthouse desktop config is not available", async () => {
    desktopConfigModule = () => {
      throw new Error("missing config");
    };

    const runSeoAudit = await loadRunSeoAudit();
    await expect(runSeoAudit("https://example.com")).rejects.toThrow(
      "lighthouse desktop config not available",
    );
  });

  it("supports lighthouse exported as default.default", async () => {
    lighthouseModule.default = { default: lighthouseMock };
    const killSpy = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
    lighthouseMock.mockResolvedValue(createResponse(0.9));

    const runSeoAudit = await loadRunSeoAudit();
    const result = await runSeoAudit("https://example.com");

    expect(result).toEqual({ score: 90, recommendations: ["Bad"] });
    expect(killSpy).toHaveBeenCalled();
  });

  it("supports lighthouse module being a function", async () => {
    lighthouseModule = lighthouseMock;
    const killSpy = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
    lighthouseMock.mockResolvedValue(createResponse(0.9));

    const runSeoAudit = await loadRunSeoAudit();
    const result = await runSeoAudit("https://example.com");

    expect(result).toEqual({ score: 90, recommendations: ["Bad"] });
    expect(killSpy).toHaveBeenCalled();
  });

  it("supports chrome-launcher exporting launch directly", async () => {
    chromeModule = { __esModule: true, launch: launchMock };
    const killSpy = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
    lighthouseMock.mockResolvedValue(createResponse(0.9));

    const runSeoAudit = await loadRunSeoAudit();
    const result = await runSeoAudit("https://example.com");

    expect(result).toEqual({ score: 90, recommendations: ["Bad"] });
    expect(killSpy).toHaveBeenCalled();
  });

  it("supports chrome-launcher exporting launch via default.default", async () => {
    chromeModule.default = { default: { launch: launchMock } };
    const killSpy = jest.fn();
    launchMock.mockResolvedValue({ port: 1234, kill: killSpy });
    lighthouseMock.mockResolvedValue(createResponse(0.9));

    const runSeoAudit = await loadRunSeoAudit();
    const result = await runSeoAudit("https://example.com");

    expect(result).toEqual({ score: 90, recommendations: ["Bad"] });
    expect(killSpy).toHaveBeenCalled();
  });
});
