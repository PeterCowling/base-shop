import { getProvider } from "../index";

describe("getProvider", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns the Cloudflare provider by default", () => {
    delete process.env.TRYON_PROVIDER;
    const provider = getProvider();
    expect(typeof provider.segmenter?.run).toBe("function");
    expect(typeof provider.depth?.run).toBe("function");
  });

  it("returns the managed provider when configured", () => {
    process.env.TRYON_PROVIDER = "external-api";
    const provider = getProvider();
    expect(typeof provider.generator?.run).toBe("function");
    expect(provider.segmenter).toBeUndefined();
  });

  it("returns an empty object for unknown providers", () => {
    process.env.TRYON_PROVIDER = "unknown";
    expect(getProvider()).toEqual({});
  });
});
