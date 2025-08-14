import { updateSeo } from "../seoService";

jest.mock("../helpers", () => ({
  authorize: jest.fn().mockResolvedValue(undefined),
  fetchSettings: jest.fn().mockResolvedValue({}),
  persistSettings: jest.fn().mockResolvedValue(undefined),
  fetchDiffHistory: jest.fn(),
}));

describe("seo service", () => {
  it("warns about long title and description", async () => {
    const fd = new FormData();
    fd.append("locale", "en");
    fd.append("title", "t".repeat(71));
    fd.append("description", "d".repeat(161));
    const result = await updateSeo("shop", fd);
    expect(result.warnings).toContain("Title exceeds 70 characters");
    expect(result.warnings).toContain("Description exceeds 160 characters");
  });
});
