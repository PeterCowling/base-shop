// packages/ui/src/components/cms/page-builder/__tests__/rules.test.ts
describe("rules allow/deny", () => {
  const mockBlocks = {
    atomRegistry: { Text: {} },
    moleculeRegistry: { Button: {} },
    organismRegistry: { Hero: {} },
    containerRegistry: { Section: {}, Grid: {}, MultiColumn: {}, MysteryContainer: {} },
    layoutRegistry: { Canvas: {}, OtherLayout: {} },
    overlayRegistry: { PopupModal: {} },
  };

  beforeEach(() => {
    jest.resetModules();
    jest.doMock("../blocks", () => mockBlocks, { virtual: true });
  });

  test("ROOT allows Section and Canvas when SECTIONS_ONLY is false", () => {
    process.env.NEXT_PUBLIC_PB_SECTIONS_ONLY = "false";
    const rules = require("../rules");
    expect(rules.isTopLevelAllowed("Section")).toBe(true);
    expect(rules.isTopLevelAllowed("Canvas")).toBe(true);
  });

  test("ROOT only allows Section when SECTIONS_ONLY is true", () => {
    jest.resetModules();
    jest.doMock("../blocks", () => mockBlocks, { virtual: true });
    process.env.NEXT_PUBLIC_PB_SECTIONS_ONLY = "true";
    const rules = require("../rules");
    expect(rules.isTopLevelAllowed("Section")).toBe(true);
    expect(rules.isTopLevelAllowed("Canvas")).toBe(false);
  });

  test("containers allow CONTENT children and isContainerType works", () => {
    jest.resetModules();
    jest.doMock("../blocks", () => mockBlocks, { virtual: true });
    process.env.NEXT_PUBLIC_PB_SECTIONS_ONLY = "false";
    const rules = require("../rules");
    expect(rules.isContainerType("Section")).toBe(true);
    // Atom/molecule treated as content, allowed under Section
    expect(rules.canDropChild("Section", "Text")).toBe(true);
    expect(rules.canDropChild("Section", "Button")).toBe(true);
    // Unknown parent disallows
    expect(rules.canDropChild("Unknown", "Text")).toBe(false);
    // Unknown (not in rules map) disallows
    expect(rules.canDropChild("Unknown", "Hero")).toBe(false);
  });
});
