import { describe, it, expect } from "vitest";
import { within } from "@testing-library/react";

import OnlyHostelGuide, { filterFaqEntries } from "../only-hostel-in-positano";
import { withGuideMocks } from "./guideTestHarness";
import { capturedFaqFallbacks } from "./guides.test-utils";

describe("filterFaqEntries", () => {
  it("removes entries without a valid question or answer", () => {
    expect(
      filterFaqEntries([
        { q: "When is check-in?", a: "After 2pm" },
        { q: " ", a: "Answer" },
        { q: "Question", a: "" },
        { q: 123, a: "Valid" },
        { q: "Another", a: 99 },
      ]),
    ).toEqual([{ q: "When is check-in?", a: "After 2pm" }]);
  });
});

describe("Only hostel in Positano guide", () => {
  it("renders translated content and normalised guide links", async () => {
    await withGuideMocks("onlyHostel", async (ctx) => {
      const { setTranslations, renderRoute, screen } = ctx;

      setTranslations("en", "header", { home: "Home" });
      setTranslations("en", "guides", {
        "labels.indexTitle": "Guides",
        "content.onlyHostel.seo.title": "Hostel Brikette overview",
        "content.onlyHostel.seo.description": "Discover the only hostel in Positano",
        "content.onlyHostel.intro": ["Intro paragraph"],
        "content.onlyHostel.toc": {
          onThisPage: "On this page",
          rooms: "Rooms",
          arrival: "Arrival",
          etiquette: "Etiquette",
          faqs: "FAQs",
        },
        "content.onlyHostel.highlightsTitle": "Highlights",
        "content.onlyHostel.highlights": ["Sea-view terrace"],
        "content.onlyHostel.saveTitle": "Ways to save",
        "content.onlyHostel.save": ["Book direct"],
        "content.onlyHostel.roomsList": ["Dorm beds"],
        "content.onlyHostel.roomsLinks": [{ key: "naplesPositano", label: "Naples to Positano" }],
        "content.onlyHostel.arrivalText": "We are steps away from the SITA bus stop.",
        "content.onlyHostel.arrivalLinks": [{ key: "salernoPositano" }],
        "content.onlyHostel.arrivalRoutesLabel": "Other routes:",
        "content.onlyHostel.arrivalRoutes": [
          { key: "naplesPositano" },
          { key: "salernoPositano", label: "Salerno to Positano" },
        ],
        "content.onlyHostel.etiquetteList": ["Respect quiet hours"],
        "content.onlyHostel.faq": [
          { q: "When is check-in?", a: "After 2pm" },
          { q: "", a: "Missing" },
        ],
        "content.naplesPositano.linkLabel": "Naples to Positano",
        "content.salernoPositano.linkLabel": "Salerno to Positano",
      });

      await renderRoute();

      expect(
        screen.getByRole("heading", { level: 1, name: "Hostel Brikette overview" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Intro paragraph")).toBeInTheDocument();
      const highlightsSection = screen.getByRole("heading", { level: 2, name: "Highlights" }).closest("section");
      expect(highlightsSection).not.toBeNull();
      expect(within(highlightsSection as HTMLElement).getAllByRole("listitem").length).toBeGreaterThan(0);
      const saveSection = screen.getByRole("heading", { level: 2, name: /save/i }).closest("section");
      expect(saveSection).not.toBeNull();
      expect(within(saveSection as HTMLElement).getAllByRole("listitem").length).toBeGreaterThan(0);

      const roomsSection = screen.getByRole("heading", { level: 2, name: "Rooms" }).closest("section");
      expect(roomsSection).not.toBeNull();
      const roomsList = within(roomsSection as HTMLElement).getAllByRole("listitem");
      expect(roomsList.length).toBeGreaterThan(0);
      expect(within(roomsSection as HTMLElement).getAllByRole("link").length).toBeGreaterThan(0);

      const arrivalSection = screen.getByRole("heading", { level: 2, name: "Arrival" }).closest("section");
      expect(arrivalSection).not.toBeNull();
      expect(
        within(arrivalSection as HTMLElement).getByText("We are steps away from the SITA bus stop."),
      ).toBeInTheDocument();
      expect(
        within(arrivalSection as HTMLElement).getByRole("link", { name: "Salerno to Positano" }),
      ).toBeInTheDocument();
      expect(within(arrivalSection as HTMLElement).getByText("Other routes:")).toBeInTheDocument();

      const toc = screen.getAllByRole("navigation", { name: "On this page" })[0]!;
      expect(within(toc).getAllByRole("link").length).toBeGreaterThan(0);

      const fallbackFn = capturedFaqFallbacks.get("onlyHostel");
      expect(fallbackFn?.("en")).toEqual([{ q: "When is check-in?", a: "After 2pm" }]);
    });
  });
});