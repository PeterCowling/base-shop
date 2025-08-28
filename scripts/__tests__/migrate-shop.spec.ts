
const tokensMock = { tokensToCssVars: jest.fn(() => ({ coverage: 80, unmapped: ["a"] })) };
const inlineMock = { inlineStylesToTokens: jest.fn(() => ({ coverage: 60, unmapped: [] })) };
const execMock = { execSync: jest.fn() };

jest.mock("../codemods/tokens-to-css-vars", () => tokensMock);
jest.mock("../codemods/inline-styles-to-tokens", () => inlineMock);
jest.mock("node:child_process", () => execMock);

describe("migrate-shop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reports without applying changes in dry run", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    const { run } = await import("../src/migrate-shop");
    const report = run({ apply: false });
    expect(tokensMock.tokensToCssVars).toHaveBeenCalledWith({ apply: false });
    expect(inlineMock.inlineStylesToTokens).toHaveBeenCalledWith({ apply: false });
    expect(report.coverage).toBe(70);
    expect(report.unmapped).toEqual(["a"]);
    expect(execMock.execSync).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("applies codemods and opens branch", async () => {
    const { run } = await import("../src/migrate-shop");
    run({ apply: true });
    expect(tokensMock.tokensToCssVars).toHaveBeenCalledWith({ apply: true });
    expect(inlineMock.inlineStylesToTokens).toHaveBeenCalledWith({ apply: true });
    expect(execMock.execSync).toHaveBeenCalledWith("git checkout -b migration-branch");
  });
});
