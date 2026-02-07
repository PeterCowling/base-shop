import React from "react";

import { Check, type LucideIcon, X } from "@/icons";

describe("@/icons barrel", () => {
  it("exports lucide components", () => {
    expect(React.isValidElement(React.createElement(Check))).toBe(true);
    expect(React.isValidElement(React.createElement(X))).toBe(true);
  });

  it("exports the LucideIcon type", () => {
    const acceptsLucideIcon = (_icon: LucideIcon) => _icon;
    expect(typeof acceptsLucideIcon).toBe("function");
  });
});
