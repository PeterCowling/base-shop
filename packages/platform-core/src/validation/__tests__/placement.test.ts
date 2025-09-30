import { validatePlacement, canDropChild } from "../placement";

const node = (type: string, children?: any[]) => ({ id: type.toLowerCase(), type, ...(children ? { children } : {}) });

describe("validatePlacement", () => {
  it("allows Section at ROOT when sectionsOnly=true", () => {
    const res = validatePlacement(node("Section"), { parent: "ROOT", sectionsOnly: true });
    expect(res.ok).toBe(true);
  });

  it("forbids Canvas at ROOT when sectionsOnly=true", () => {
    const res = validatePlacement(node("Canvas"), { parent: "ROOT", sectionsOnly: true });
    expect(res.ok).toBe(false);
  });

  it("allows Canvas at ROOT when sectionsOnly=false", () => {
    const res = validatePlacement(node("Canvas"), { parent: "ROOT", sectionsOnly: false });
    expect(res.ok).toBe(true);
  });

  it("forbids content at ROOT when sectionsOnly=true", () => {
    const res = validatePlacement(node("Text"), { parent: "ROOT", sectionsOnly: true });
    expect(res.ok).toBe(false);
  });

  it("allows content inside Section", () => {
    const res = validatePlacement(node("Section", [node("Text")]), { parent: "ROOT", sectionsOnly: true });
    expect(res.ok).toBe(true);
  });

  it("forbids Section nested under Section by default", () => {
    const res = validatePlacement(node("Section", [node("Section")]), { parent: "ROOT", sectionsOnly: true });
    expect(res.ok).toBe(false);
  });

  it("canDropChild helper mirrors defaults", () => {
    expect(canDropChild("ROOT", "Section", true)).toBe(true);
    expect(canDropChild("ROOT", "Canvas", true)).toBe(false);
    expect(canDropChild("ROOT", "Canvas", false)).toBe(true);
    expect(canDropChild("Section", "Text", true)).toBe(true);
  });
});

