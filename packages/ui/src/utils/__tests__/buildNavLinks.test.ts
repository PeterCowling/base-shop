/* i18n-exempt file -- TEST-0001: unit test titles and literals are not user-facing */
import { buildNavLinks } from "../buildNavLinks";

const stub = (key: string, defaultValue?: string): string => defaultValue ?? key;

describe("buildNavLinks", () => {
  describe("rooms children", () => {
    it("TC-01: has 11 children (1 sentinel + 10 rooms)", () => {
      const { navLinks } = buildNavLinks("en", stub);
      const rooms = navLinks.find((l) => l.key === "rooms")!;
      expect(rooms.children).toHaveLength(11);
    });

    it("TC-02: all children have distinct label values", () => {
      const { navLinks } = buildNavLinks("en", stub);
      const rooms = navLinks.find((l) => l.key === "rooms")!;
      const labels = rooms.children!.map((c) => c.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("TC-03: room detail children follow /rooms/{id} pattern (no lang prefix)", () => {
      const { navLinks } = buildNavLinks("en", stub);
      const rooms = navLinks.find((l) => l.key === "rooms")!;
      const detailChildren = rooms.children!.filter((c) => c.key !== "rooms_all");
      detailChildren.forEach((child) => {
        expect(child.to).toMatch(/^\/rooms\/[a-z0-9_]+$/);
      });
    });

    it("first child is the See-all sentinel pointing to /rooms", () => {
      const { navLinks } = buildNavLinks("en", stub);
      const rooms = navLinks.find((l) => l.key === "rooms")!;
      const first = rooms.children![0];
      expect(first.key).toBe("rooms_all");
      expect(first.label).toBe("See all rooms");
      expect(first.to).toBe("/rooms");
    });
  });

  it("TC-04: non-rooms nav items have children undefined", () => {
    const { navLinks } = buildNavLinks("en", stub);
    navLinks.filter((l) => l.key !== "rooms").forEach((item) => {
      expect(item.children).toBeUndefined();
    });
  });
});
