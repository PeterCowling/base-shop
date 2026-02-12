import "@testing-library/jest-dom";

import fs from "fs";
import path from "path";

// TC-01: "apartment" is in NAV_ITEMS array
describe("Navigation integration", () => {
  it("includes 'apartment' in NAV_ITEMS", () => {
    const { NAV_ITEMS } = require("@/config/navItems");
    expect(NAV_ITEMS).toContain("apartment");
  });
});

// TC-02: header.json has apartment nav label
describe("Header translations", () => {
  it("has an apartment translation key", () => {
    const headerPath = path.resolve(
      __dirname,
      "../../../locales/en/header.json",
    );
    const header = JSON.parse(fs.readFileSync(headerPath, "utf-8"));
    expect(header.apartment).toBe("Apartment");
  });
});

// TC-03: _redirects contains stepfreepositano.com redirect rule
describe("Redirects configuration", () => {
  it("includes stepfreepositano.com redirect", () => {
    const redirectsPath = path.resolve(
      __dirname,
      "../../../../public/_redirects",
    );
    const content = fs.readFileSync(redirectsPath, "utf-8");
    expect(content).toContain("stepfreepositano.com");
  });
});

// TC-04: apartment.jsonld contains updated schema fields
describe("Apartment structured data", () => {
  it("includes occupancy and floorSize fields", () => {
    const jsonldPath = path.resolve(
      __dirname,
      "../../../schema/apartment.jsonld",
    );
    const schema = JSON.parse(fs.readFileSync(jsonldPath, "utf-8"));

    expect(schema["@type"]).toBe("Apartment");
    expect(schema.occupancy).toBeDefined();
    expect(schema.occupancy.value).toBe(4);
    expect(schema.floorSize).toBeDefined();
    expect(schema.floorSize.value).toBe(100);
    expect(schema.floorSize.unitCode).toBe("MTK");
    expect(schema.numberOfRooms).toBeDefined();
    expect(schema.numberOfBedrooms).toBeDefined();
    expect(schema.numberOfBathroomsTotal).toBeDefined();
    expect(schema.petsAllowed).toBe(false);
  });

  it("mentions step-free in description", () => {
    const jsonldPath = path.resolve(
      __dirname,
      "../../../schema/apartment.jsonld",
    );
    const schema = JSON.parse(fs.readFileSync(jsonldPath, "utf-8"));

    expect(schema.description.toLowerCase()).toContain("step-free");
  });
});

// TC-05: GA4 event tracking utility fires with correct event names
describe("Apartment GA4 tracking", () => {
  let gtagMock: jest.Mock;

  beforeEach(() => {
    gtagMock = jest.fn();
    (window as unknown as { gtag: jest.Mock }).gtag = gtagMock;
  });

  afterEach(() => {
    delete (window as unknown as { gtag?: jest.Mock }).gtag;
  });

  it("fires click_check_availability with source page", () => {
    const { trackApartmentEvent } = require("@/utils/trackApartmentEvent");
    trackApartmentEvent("click_check_availability", { source: "hub" });

    expect(gtagMock).toHaveBeenCalledWith(
      "event",
      "click_check_availability",
      expect.objectContaining({ source: "hub" }),
    );
  });

  it("fires click_whatsapp event", () => {
    const { trackApartmentEvent } = require("@/utils/trackApartmentEvent");
    trackApartmentEvent("click_whatsapp", { source: "street-level-arrival" });

    expect(gtagMock).toHaveBeenCalledWith(
      "event",
      "click_whatsapp",
      expect.objectContaining({ source: "street-level-arrival" }),
    );
  });

  it("does not throw when gtag is not available", () => {
    delete (window as unknown as { gtag?: jest.Mock }).gtag;

    const { trackApartmentEvent } = require("@/utils/trackApartmentEvent");

    expect(() => {
      trackApartmentEvent("click_check_availability", { source: "hub" });
    }).not.toThrow();
  });
});
