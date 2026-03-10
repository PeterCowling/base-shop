/* i18n-exempt file -- TEST-0001: unit test titles and literals are not user-facing */
import { buildNavLinks } from "../buildNavLinks";
import { translatePath } from "../translate-path";

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

    it("TC-03: room detail children follow /{rooms-slug}/{slug} pattern (no lang prefix)", () => {
      const { navLinks, slugs } = buildNavLinks("en", stub);
      const rooms = navLinks.find((l) => l.key === "rooms")!;
      const roomsSlug = slugs["rooms"]; // "/dorms" in English per slug-map.ts
      const detailChildren = rooms.children!.filter((c) => c.key !== "rooms_all");
      detailChildren.forEach((child) => {
        // starts with the rooms slug and ends with a valid slug segment (letters, digits, hyphens)
        expect(child.to.startsWith(roomsSlug + "/")).toBe(true);
        expect(child.to.slice(roomsSlug.length + 1)).toMatch(/^[a-z0-9-]+$/);
      });
    });

    it("first child is the See-all sentinel pointing to the booking page", () => {
      const { navLinks } = buildNavLinks("en", stub);
      const rooms = navLinks.find((l) => l.key === "rooms")!;
      const first = rooms.children![0];
      expect(first.key).toBe("rooms_all");
      expect(first.label).toBe("See all rooms");
      expect(first.to).toBe(`/${translatePath("book", "en")}`);
    });
  });

  it("TC-04: non-dropdown nav items have children undefined", () => {
    const { navLinks } = buildNavLinks("en", stub);
    navLinks.filter((l) => l.key !== "rooms" && l.key !== "apartment").forEach((item) => {
      expect(item.children).toBeUndefined();
    });
  });

  it("apartment nav links to private booking and keeps detail children", () => {
    const { navLinks, slugs } = buildNavLinks("en", stub);
    const apartment = navLinks.find((l) => l.key === "apartment")!;
    expect(apartment.to).toBe("/book-private-accommodations");
    expect(apartment.to).not.toBe(slugs["apartment"]);
    expect(apartment.children?.[0]).toEqual({
      key: "apartment_book_private",
      to: "/book-private-accommodations",
      label: "Book private accommodations",
    });
    expect(apartment.children?.[1]).toEqual({
      key: "apartment_apartment",
      to: "/private-rooms/sea-view-apartment",
      label: "Apartment",
    });
    expect(apartment.children?.[2]).toEqual({
      key: "apartment_double_room",
      to: "/private-rooms/double-room",
      label: "Double Room",
    });
  });

  it("uses translated child labels when provided", () => {
    const translated = (key: string, defaultValue?: string): string => {
      const translations: Record<string, string> = {
        "navChildren.rooms.all": "كل الغرف",
        "navChildren.rooms.room_10": "مهجع مختلط – حمّام داخلي",
        "navChildren.apartment.bookPrivate": "احجز الغرف الخاصة",
        "navChildren.apartment.apartment": "شقة",
        "navChildren.apartment.doubleRoom": "غرفة مزدوجة",
      };
      return translations[key] ?? defaultValue ?? key;
    };

    const { navLinks } = buildNavLinks("ar", translated);
    const rooms = navLinks.find((link) => link.key === "rooms");
    const apartment = navLinks.find((link) => link.key === "apartment");

    expect(rooms?.children?.[0]?.label).toBe("كل الغرف");
    expect(rooms?.children?.find((child) => child.key === "room_10")?.label).toBe(
      "مهجع مختلط – حمّام داخلي",
    );
    expect(apartment?.children?.[0]?.label).toBe("احجز الغرف الخاصة");
    expect(apartment?.children?.[1]?.label).toBe("شقة");
    expect(apartment?.children?.[2]?.label).toBe("غرفة مزدوجة");
  });
});
