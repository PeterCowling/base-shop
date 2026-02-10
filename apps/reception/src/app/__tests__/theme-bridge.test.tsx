import fs from "node:fs";
import path from "node:path";

describe("reception theme bridge", () => {
  it("TC-01: globals import shared theme tokens and expose legacy + semantic bridges", () => {
    const cssPath = path.join(__dirname, "..", "globals.css");
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain('@import "@themes/base/tokens.css";');
    expect(css).toContain("--reception-dark-bg");
    expect(css).toContain("--reception-dark-surface");
    expect(css).toContain("--reception-dark-accent-green");
    expect(css).toContain("--reception-dark-accent-orange");
    expect(css).toContain("--reception-surface-dark");
    expect(css).toContain("--reception-accent-hospitality");
    expect(css).toContain("--reception-signal-ready-bg");
    expect(css).toContain("--reception-signal-warning-bg");
    expect(css).toContain("--reception-signal-info-bg");
  });
});
