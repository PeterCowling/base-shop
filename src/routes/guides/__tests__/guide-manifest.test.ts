// src/routes/guides/__tests__/guide-manifest.test.ts
import { describe, it, expect } from "vitest";

import { buildGuideChecklist, getGuideManifestEntry } from "../guide-manifest";

describe("guide manifest", () => {
  it("exposes the luggage storage guide entry", () => {
    const entry = getGuideManifestEntry("luggageStorage");
    expect(entry).toBeDefined();
    expect(entry?.slug).toBe("luggage-storage-positano");
    expect(entry?.primaryArea).toBe("help");
    expect(entry?.status).toBe("live");
  });

  it("builds a checklist with declared overrides", () => {
    const entry = getGuideManifestEntry("luggageStorage");
    expect(entry).toBeDefined();
    const checklist = buildGuideChecklist(entry!);
    expect(checklist.status).toBe("live");
    const translationsItem = checklist.items.find((item) => item.id === "translations");
    expect(translationsItem?.status).toBe("inProgress");
    const jsonItem = checklist.items.find((item) => item.id === "jsonLd");
    expect(jsonItem?.status).toBe("complete");
  });

  it("includes the 48-hour weekend guide with experience routing", () => {
    const entry = getGuideManifestEntry("weekend48Positano");
    expect(entry).toBeDefined();
    expect(entry?.areas).toEqual(["experience"]);
    expect(entry?.structuredData).toContain("Article");
    const checklist = buildGuideChecklist(entry!);
    expect(checklist.items.find((item) => item.id === "faqs")).toBeDefined();
  });

  it("registers the seven-day no-car itinerary with suppress fallback option", () => {
    const entry = getGuideManifestEntry("sevenDayNoCar");
    expect(entry).toBeDefined();
    expect(entry?.primaryArea).toBe("experience");
    expect(entry?.options?.suppressUnlocalizedFallback).toBe(true);
    const checklist = buildGuideChecklist(entry!);
    expect(checklist.items.find((item) => item.id === "jsonLd")?.status).toBeDefined();
  });

  it("records the Capri day-trip manifest metadata", () => {
    const entry = getGuideManifestEntry("capriDayTrip");
    expect(entry).toBeDefined();
    expect(entry?.relatedGuides).toEqual(["ferrySchedules", "boatTours", "whatToPack"]);
    expect(entry?.structuredData).toContain("HowTo");
    expect(entry?.options?.suppressUnlocalizedFallback).toBe(true);
    const checklist = buildGuideChecklist(entry!);
    expect(checklist.items.find((item) => item.id === "media")?.status).toBe("inProgress");
  });

  it("captures the itineraries pillar guide configuration", () => {
    const entry = getGuideManifestEntry("itinerariesPillar");
    expect(entry).toBeDefined();
    expect(entry?.structuredData).toEqual(["Article", "HowTo", "FAQPage"]);
    expect(entry?.options?.preferManualWhenUnlocalized).toBe(true);
    const checklist = buildGuideChecklist(entry!);
    expect(checklist.items.find((item) => item.id === "translations")?.status).toBe("inProgress");
  });

  it("tracks the public transport guide metadata", () => {
    const entry = getGuideManifestEntry("publicTransportAmalfi");
    expect(entry).toBeDefined();
    expect(entry?.relatedGuides).toEqual(["transportBudget", "ferrySchedules", "sitaTickets"]);
    expect(entry?.options?.showTransportNotice).toBe(true);
    const checklist = buildGuideChecklist(entry!);
    expect(checklist.items.find((item) => item.id === "media")?.status).toBe("missing");
  });
});