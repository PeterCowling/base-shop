import { lintMarketIntelligencePack } from "../market-intelligence-pack-lint";

describe("market-intelligence-pack-lint", () => {
  it("flags clipboard artifacts, placeholders, and missing Evidence URLs", () => {
    const content = [
      "# Pack",
      "",
      "text",
      "Copy",
      "",
      "(internal baseline; site evidence )",
      "",
      "| Competitor | Evidence (URL) |",
      "|---|---|",
      "| Foo |  |",
      "",
      "Panoramic elevated view of something",
      "",
    ].join("\n");

    const issues = lintMarketIntelligencePack({
      filePath: "/repo/docs/business-os/market-research/TEST/2026-02-15-market-intelligence.user.md",
      content,
    });

    expect(issues.map((i) => i.code)).toEqual(
      expect.arrayContaining([
        "clipboard_artifact_text_copy",
        "placeholder_site_evidence",
        "missing_table_evidence_url",
        "stray_image_caption",
      ]),
    );
  });

  it("does not require URLs in Evidence cells for operator-fill tables", () => {
    const content = [
      "# Pack",
      "",
      "### Parity Table (operator-fill)",
      "",
      "| Scenario | Evidence (URL) |",
      "|---|---|",
      "| S1 | (property listing URL) |",
      "",
    ].join("\n");

    const issues = lintMarketIntelligencePack({
      filePath: "/repo/docs/business-os/market-research/TEST/2026-02-15-market-intelligence.user.md",
      content,
    });

    expect(issues.find((i) => i.code === "missing_table_evidence_url")).toBeUndefined();
  });
});
