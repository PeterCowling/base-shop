import { describe, expect, it } from "@jest/globals";

import { getThemeInitScript } from "../../utils/themeInit";

describe("theme init script", () => {
  it("toggles the theme-dark class for Tailwind dark variants", () => {
    const script = getThemeInitScript();

    expect(script).toContain('classList.toggle("theme-dark"');
  });
});
