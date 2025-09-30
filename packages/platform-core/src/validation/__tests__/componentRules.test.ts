import { validateComponentRules } from "../componentRules";

const base = (overrides: any = {}) => ({ id: "c1", type: "Text", ...overrides });

describe("validateComponentRules", () => {
  it("passes for simple text without layout hazards", () => {
    const res = validateComponentRules([base({ text: "Hello" }) as any]);
    expect(res).toEqual({ ok: true });
  });

  it("flags absolute at root", () => {
    const res = validateComponentRules([base({ position: "absolute" }) as any]);
    expect(res.ok).toBe(false);
  });

  it("flags 100vw in widthMobile", () => {
    const res = validateComponentRules([base({ widthMobile: "100vw" }) as any]);
    expect(res.ok).toBe(false);
    if (res.ok === false) {
      expect(res.issues?.some((i) => (i.path || []).includes("widthMobile"))).toBe(true);
    }
  });

  it("requires cropAspect and alt for Image", () => {
    const img = { id: "i1", type: "Image" };
    const res = validateComponentRules([img as any]);
    expect(res.ok).toBe(false);
    if (res.ok === false) {
      const msgs = res.errors.join(" ");
      expect(msgs).toMatch(/cropAspect/);
      expect(msgs).toMatch(/alt/);
      expect(res.issues?.some((i) => Array.isArray(i.path) && i.path.includes("cropAspect"))).toBe(true);
      expect(res.issues?.some((i) => Array.isArray(i.path) && i.path.includes("alt"))).toBe(true);
    }
  });

  it("flags sticky without offset", () => {
    const res = validateComponentRules([base({ sticky: "top" }) as any]);
    expect(res.ok).toBe(false);
  });

  it("enforces min/max items bounds on device items", () => {
    const comp = base({ minItems: 2, maxItems: 4, desktopItems: 1 });
    const res = validateComponentRules([comp as any]);
    expect(res.ok).toBe(false);
  });

  it("requires animationDuration when animation is set", () => {
    const comp = base({ animation: "fade" });
    const res = validateComponentRules([comp as any]);
    expect(res.ok).toBe(false);
  });

  it("flags zIndex without position", () => {
    const comp = base({ zIndex: 10 });
    const res = validateComponentRules([comp as any]);
    expect(res.ok).toBe(false);
  });

  it("flags negative margin deeply nested and surfaces path", () => {
    const comp = {
      id: "s1",
      type: "Section",
      children: [
        { id: "c1", type: "Text", margin: "-8px" },
      ],
    };
    const res = validateComponentRules([comp as any]);
    expect(res.ok).toBe(false);
    if (res.ok === false) {
      const hasPath = res.issues?.some((i) => Array.isArray(i.path) && i.path.join("/").includes("children/0/margin"));
      expect(hasPath).toBe(true);
    }
  });

  it("flags absolute child without positioned ancestor and surfaces its path", () => {
    const comp = {
      id: "s1",
      type: "Section",
      children: [
        { id: "c1", type: "Text", position: "absolute" },
      ],
    };
    const res = validateComponentRules([comp as any]);
    expect(res.ok).toBe(false);
    if (res.ok === false) {
      const hasPath = res.issues?.some((i) => Array.isArray(i.path) && i.path.join("/").includes("children/0/position"));
      expect(hasPath).toBe(true);
    }
  });

  it("requires at least 2 slides for ImageSlider when provided", () => {
    const comp = { id: "x", type: "ImageSlider", slides: [{ src: "a.jpg" }] };
    const res = validateComponentRules([comp as any]);
    expect(res.ok).toBe(false);
    if (res.ok === false) {
      const hasPath = res.issues?.some((i) => (i.path || []).includes("slides"));
      expect(hasPath).toBe(true);
    }
  });

  it("flags non-container components that have children", () => {
    const comp = {
      id: "x",
      type: "Text",
      children: [{ id: "y", type: "Text" }],
    };
    const res = validateComponentRules([comp as any]);
    expect(res.ok).toBe(false);
    if (res.ok === false) {
      const msg = res.errors.join(" ");
      expect(msg).toMatch(/cannot have children/i);
    }
  });

  it("allows container components to have children (e.g., Section)", () => {
    const comp = {
      id: "s1",
      type: "Section",
      children: [{ id: "t1", type: "Text", text: "Hi" }],
    };
    const res = validateComponentRules([comp as any]);
    expect(res.ok).toBe(true);
  });

  it("flags raw color usage on backgroundColor", () => {
    const comp = base({ backgroundColor: "#ff00aa" });
    const res = validateComponentRules([comp as any]);
    expect(res.ok).toBe(false);
    if (res.ok === false) {
      const found = res.issues?.some((i) => Array.isArray(i.path) && i.path.includes("backgroundColor"));
      expect(found).toBe(true);
    }
  });

  it("does not flag tokenized color (CSS var)", () => {
    const comp = base({ color: "var(--color.text)" });
    const res = validateComponentRules([comp as any]);
    expect(res.ok).toBe(true);
  });
});
