import { evaluateLegalLinks } from "../configurator";

describe("evaluateLegalLinks", () => {
  it("passes when published legal pages exist", () => {
    const result = evaluateLegalLinks(
      {
        navigation: [{ label: "Home", url: "/" }],
        returnPolicyUrl: undefined,
        termsUrl: undefined,
        privacyUrl: undefined,
      },
      [
        { slug: "terms", status: "published" },
        { slug: "privacy", status: "published" },
        { slug: "returns", status: "published" },
      ],
    );

    expect(result.missing).toEqual([]);
  });

  it("accepts explicit URLs for all legal links", () => {
    const result = evaluateLegalLinks(
      {
        navigation: [],
        termsUrl: "https://example.com/terms",
        privacyUrl: "https://example.com/privacy",
        returnPolicyUrl: "https://example.com/returns",
      },
      [],
    );

    expect(result.missing).toEqual([]);
  });

  it("reports missing categories when nothing is configured", () => {
    const result = evaluateLegalLinks(
      {
        navigation: [],
        termsUrl: "",
        privacyUrl: "",
        returnPolicyUrl: undefined,
      } as any,
      [],
    );

    expect(result.missing).toEqual(
      expect.arrayContaining(["terms", "privacy", "refund"]),
    );
  });
});
