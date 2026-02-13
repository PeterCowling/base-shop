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

const APP_DIR = path.resolve(__dirname, "../../../app/[lang]/apartment");

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
