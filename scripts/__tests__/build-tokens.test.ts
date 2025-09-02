/** @jest-environment node */
import {
  generateStaticCss,
  generateDynamicCss,
  generateThemeCss,
} from "../../dist-scripts/build-tokens.js";

describe("build-tokens", () => {
  it("generates static css with dark variants", () => {
    const css = generateStaticCss({
      "--color": { light: "white", dark: "black" },
      "--bg": { light: "green" },
    });
    expect(css).toContain(":root {");
    expect(css).toContain("--color: white;");
    expect(css).toContain("--color-dark: black;");
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain("html.theme-dark");
  });

  it("generates dynamic css using variables", () => {
    const css = generateDynamicCss({
      "--color": { light: "white", dark: "black" },
    });
    expect(css).toContain("--color: var(--token-color, white);");
    expect(css).toContain("--color-dark: var(--token-color-dark, black);");
  });

  it("generates theme css only when base token present", () => {
    const css = generateThemeCss({
      "--color": "white",
      "--color-dark": "black",
      "--orphan-dark": "red",
    });
    expect(css).toContain("--color: white;");
    expect(css).toContain("--color-dark: black;");
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain("html.theme-dark");
    expect(css).not.toContain("--orphan-dark");
  });
});
