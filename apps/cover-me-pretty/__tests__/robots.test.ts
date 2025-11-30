jest.mock("@acme/config/env/core", () => ({
  loadCoreEnv: () => ({ NEXT_PUBLIC_BASE_URL: "https://example.com" }),
}));

describe("robots", () => {
  it("returns sitemap entries", async () => {
    const { default: robots } = await import("../src/app/robots");
    const data = robots();
    expect(data.sitemap).toEqual([
      "https://example.com/sitemap.xml",
      "https://example.com/ai-sitemap.xml",
    ]);
    expect(data.rules[0]).toEqual({ userAgent: "*", allow: "/" });
  });
});

