/**
 * Apartment WhatsApp link validity tests (TASK-02 validation)
 *
 * Verifies WhatsApp links contain valid phone numbers across all apartment pages.
 * Hub page structure order is verified visually (hero above fold per brief 6A).
 */
import fs from "fs";
import path from "path";

const WHATSAPP_NUMBER = "393287073695";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

const APP_DIR = path.resolve(__dirname, "../../../app/[lang]/private-rooms");

describe("WhatsApp link validity across apartment pages", () => {
  // TC-02: Hub page has WhatsApp CTA
  it("hub page contains WhatsApp URL with phone number", () => {
    const content = fs.readFileSync(
      path.join(APP_DIR, "ApartmentPageContent.tsx"),
      "utf-8",
    );
    expect(content).toContain(WHATSAPP_URL);
  });

  // TC-03: Street-level page WhatsApp href
  it("street-level page contains WhatsApp URL with phone number", () => {
    const content = fs.readFileSync(
      path.join(
        APP_DIR,
        "street-level-arrival/StreetLevelArrivalContent.tsx",
      ),
      "utf-8",
    );
    expect(content).toContain(WHATSAPP_NUMBER);
    // Verify no empty wa.me/ links remain
    expect(content).not.toMatch(/href="https:\/\/wa\.me\/"/);
  });

  // TC-04: Private-stay page WhatsApp href
  it("private-stay page contains WhatsApp URL with phone number", () => {
    const content = fs.readFileSync(
      path.join(APP_DIR, "private-stay/PrivateStayContent.tsx"),
      "utf-8",
    );
    expect(content).toContain(WHATSAPP_NUMBER);
    // Verify no empty wa.me/ links remain
    expect(content).not.toMatch(/href="https:\/\/wa\.me\/"/);
  });

  // TC-04b: Booking page WhatsApp href (regression)
  it("booking page contains WhatsApp URL with phone number", () => {
    const content = fs.readFileSync(
      path.join(APP_DIR, "book/ApartmentBookContent.tsx"),
      "utf-8",
    );
    expect(content).toContain(WHATSAPP_NUMBER);
  });
});

describe("TASK-07: apartment-context CTA, legal label, and perks-route behavior", () => {
  const UI_DIR = path.resolve(__dirname, "../../../../../../packages/ui/src/organisms");
  const BRIKETTE_SRC = path.resolve(__dirname, "../../../");
  const BANNER_FILE = path.join(BRIKETTE_SRC, "components/header/NotificationBanner.tsx");

  // TC-01: DesktopHeader uses apartment-aware CTA routing
  it("DesktopHeader has apartment-aware bookHref that routes to apartment/book", () => {
    const content = fs.readFileSync(path.join(UI_DIR, "DesktopHeader.tsx"), "utf-8");
    expect(content).toMatch(/isApartmentRoute/);
    expect(content).toContain("apartmentPath}/book");
  });

  // TC-02: MobileNav uses apartment-aware CTA routing
  it("MobileNav has apartment-aware bookHref that routes to apartment/book", () => {
    const content = fs.readFileSync(path.join(UI_DIR, "MobileNav.tsx"), "utf-8");
    expect(content).toMatch(/isApartmentRoute/);
    expect(content).toContain("apartmentPath}/book");
  });

  // TC-03: footer.json terms label is accommodation-neutral
  it("footer.json terms label does not contain hostel-specific 'Room Bookings' text", () => {
    const footerJson = JSON.parse(
      fs.readFileSync(path.join(BRIKETTE_SRC, "locales/en/footer.json"), "utf-8"),
    );
    expect(footerJson.terms).toBeDefined();
    expect(footerJson.terms.toLowerCase()).not.toContain("room bookings");
  });

  // TC-04: NotificationBanner is suppressed on private-rooms routes
  it("NotificationBanner source contains usePathname guard returning null on private-rooms routes", () => {
    const content = fs.readFileSync(BANNER_FILE, "utf-8");
    expect(content).toContain("usePathname");
    expect(content).toMatch(/private-rooms/);
  });
});

describe("Hub page structure", () => {
  // TC-01: HeroSection renders before intent cards (source order check)
  it("HeroSection appears before intent-routing cards in source", () => {
    const content = fs.readFileSync(
      path.join(APP_DIR, "ApartmentPageContent.tsx"),
      "utf-8",
    );
    const heroIdx = content.indexOf("<HeroSection");
    const cardIdx = content.indexOf("hub.streetLevelCard");
    expect(heroIdx).toBeGreaterThan(-1);
    expect(cardIdx).toBeGreaterThan(-1);
    expect(heroIdx).toBeLessThan(cardIdx);
  });

  // TC-05: Hub renders WhatsApp CTA (not just Check availability)
  it("hub page has both Check availability and WhatsApp CTAs", () => {
    const content = fs.readFileSync(
      path.join(APP_DIR, "ApartmentPageContent.tsx"),
      "utf-8",
    );
    expect(content).toContain("click_check_availability");
    expect(content).toContain("click_whatsapp");
  });
});
