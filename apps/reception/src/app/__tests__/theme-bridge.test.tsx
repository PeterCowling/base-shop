import fs from "node:fs";
import path from "node:path";

describe("reception theme bridge", () => {
  it("TC-01: globals import shared theme tokens and expose hospitality aliases", () => {
    const cssPath = path.join(__dirname, "..", "globals.css");
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain('@import "@themes/base/tokens.css";');
    expect(css).toContain("--reception-signal-ready-bg");
    expect(css).toContain("--reception-signal-warning-bg");
    expect(css).toContain("--reception-signal-info-bg");
  });
});
