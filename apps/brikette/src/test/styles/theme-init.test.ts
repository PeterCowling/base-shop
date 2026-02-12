import { describe, expect, it } from "@jest/globals";

import { initTheme } from "@acme/platform-core/utils";

describe("theme init script", () => {
  it("toggles the theme-dark class for Tailwind dark variants", () => {
    const script = initTheme;

    expect(script).toContain("classList.add('theme-dark')");
    expect(script).toContain("classList.remove('theme-dark')");
  });
});
