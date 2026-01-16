import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";

import { withGuideMocks } from "./guideTestHarness";

const findImageByPath = (path: string) =>
  Array.from(document.querySelectorAll("img")).find((img) => img.getAttribute("src")?.includes(path));

const seedLauritoSections = () => [
  { id: "ride-the-bus", title: "Take the bus", body: ["Step instructions"] },
  { id: "get-off-bus", title: "Exit the bus", body: ["Arrival instructions"] },
];

describe("Bus return guides extras", () => {
  it("derives gallery content for the Arienzo return guide using English fallbacks", async () => {
    await withGuideMocks("arienzoBeachBusBack", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.arienzoBeachBusBack.gallery.title": " ",
        "content.arienzoBeachBusBack.gallery.items": [],
      });
      setTranslations("en", "guides", {
        "content.arienzoBeachBusBack.gallery.title": "Arienzo bus stop reference",
        "content.arienzoBeachBusBack.gallery.items": [
          {
            alt: "Blue-and-white SITA bus stop sign on metal pole",
            caption: "Look for the SITA bus stop sign on the inland side of the road above Arienzo.",
          },
        ],
      });

      await renderRoute({ lang: "it" });

      expect(
        screen.getByRole("heading", { level: 2, name: "Arienzo bus stop reference" }),
      ).toBeInTheDocument();

      const gallery = screen.getByTestId("image-gallery");
      const images = within(gallery).getAllByRole("img");
      expect(images).toHaveLength(1);
      expect(images[0]).toHaveAttribute("alt", "Blue-and-white SITA bus stop sign on metal pole");
      expect(
        within(gallery).getByText("Look for the SITA bus stop sign on the inland side of the road above Arienzo."),
      ).toBeInTheDocument();
    });
  });

  it("omits the gallery section when translations provide no usable items", async () => {
    await withGuideMocks("arienzoBeachBusBack", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.arienzoBeachBusBack.gallery.title": "",
        "content.arienzoBeachBusBack.gallery.items": [],
      });
      setTranslations("en", "guides", {
        "content.arienzoBeachBusBack.gallery.title": "",
        "content.arienzoBeachBusBack.gallery.items": [],
      });

      await renderRoute({ lang: "it" });

      expect(screen.queryByTestId("image-gallery")).toBeNull();
    });
  });

  it("normalises article lead copy for the Laurito return bus guide", async () => {
    await withGuideMocks("lauritoBeachBusBack", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "content.lauritoBeachBusBack.intro": ["Intro"],
        "content.lauritoBeachBusBack.sections": seedLauritoSections(),
        "content.lauritoBeachBusBack.articleLead": {
          scanHeading: "  Scan and ride  ",
          qrAlt: "  QR alt  ",
          rideAlt: "  Ride alt  ",
          rideCaption: "  Ride caption  ",
          stopAlt: "  Stop alt  ",
          stopCaption: "  Stop caption  ",
        },
      });

      await renderRoute({ lang: "en" });

      expect(screen.getByText("Scan and ride")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "QR alt" })).toBeInTheDocument();
      const rideImage = findImageByPath("laurito-bus-ride");
      expect(rideImage).toHaveAttribute("alt", "Ride alt");
      expect(screen.getAllByText("Ride caption").length).toBeGreaterThan(0);
      const stopImage = findImageByPath("laurito-chiesa-nuova-stop");
      expect(stopImage).toHaveAttribute("alt", "Stop alt");
      expect(screen.getAllByText("Stop caption").length).toBeGreaterThan(0);
    });
  });

  it("falls back to empty strings when the Laurito article lead payload is malformed", async () => {
    await withGuideMocks("lauritoBeachBusBack", async ({ setTranslations, renderRoute }) => {
      setTranslations("en", "guides", {
        "content.lauritoBeachBusBack.intro": ["Intro"],
        "content.lauritoBeachBusBack.sections": seedLauritoSections(),
        "content.lauritoBeachBusBack.articleLead": {
          scanHeading: " ",
          qrAlt: " ",
          rideAlt: " ",
          stopAlt: null,
        },
      });

      await renderRoute({ lang: "en" });

      expect(findImageByPath("laurito-bus-qr")).toHaveAttribute("alt", "");
      expect(findImageByPath("laurito-bus-ride")).toHaveAttribute("alt", "");
      expect(findImageByPath("laurito-chiesa-nuova-stop")).toHaveAttribute("alt", "");
    });
  });

  it("uses default photo copy when translations are absent for the Positano return guide", async () => {
    await withGuideMocks("positanoMainBeachBusBack", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.positanoMainBeachBusBack.extras.photos.title": "",
        "content.positanoMainBeachBusBack.extras.photos.items": {},
      });
      setTranslations("en", "guides", {
        "content.positanoMainBeachBusBack.extras.photos.title": "Photos",
        "content.positanoMainBeachBusBack.extras.photos.items": {
          busInterior: {
            alt: "Interno Positano bus at the beach-side stop",
            caption: "Interno Positano bus — vehicles vary but the route label stays the same.",
          },
          barInternazionaleStop: {
            alt: "Chiesa Nuova / Bar Internazionale bus stop",
            caption: "Chiesa Nuova (Bar Internazionale) — closest stop to Hostel Brikette.",
          },
        },
      });

      await renderRoute({ lang: "it" });

      expect(screen.getByRole("heading", { level: 2, name: "Photos" })).toBeInTheDocument();
      expect(findImageByPath("interno-positano-bus")).toHaveAttribute(
        "alt",
        "Interno Positano bus at the beach-side stop",
      );
      expect(findImageByPath("bar-internazionale-stop")).toHaveAttribute(
        "alt",
        "Chiesa Nuova / Bar Internazionale bus stop",
      );
    });
  });

  it("prefers translated photo copy when provided for the Positano return guide", async () => {
    await withGuideMocks("positanoMainBeachBusBack", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.positanoMainBeachBusBack.extras.photos.title": "Foto",
        "content.positanoMainBeachBusBack.extras.photos.items": {
          busInterior: {
            alt: "Autobus tradotto",
            caption: "Interno aggiornato",
          },
          barInternazionaleStop: {
            alt: "Fermata tradotta",
            caption: "Fermata aggiornata",
          },
        },
      });

      await renderRoute({ lang: "it" });

      expect(screen.getByRole("heading", { level: 2, name: "Foto" })).toBeInTheDocument();
      expect(findImageByPath("interno-positano-bus")).toHaveAttribute("alt", "Autobus tradotto");
      expect(findImageByPath("bar-internazionale-stop")).toHaveAttribute("alt", "Fermata tradotta");
      expect(screen.getByText("Interno aggiornato")).toBeInTheDocument();
      expect(screen.getByText("Fermata aggiornata")).toBeInTheDocument();
    });
  });

  it("renders scan-to-share content with fallbacks for the Arienzo outbound guide", async () => {
    await withGuideMocks("hostelBriketteToArienzoBus", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.hostelBriketteToArienzoBus.afterArticle.scanToShareHeading": "   ",
        "content.hostelBriketteToArienzoBus.afterArticle.scanToShareGalleryAlt": ["  Alt 1  ", "", null],
      });
      setTranslations("en", "guides", {
        "content.hostelBriketteToArienzoBus.afterArticle.scanToShareHeading": "Scan to Share",
        "content.hostelBriketteToArienzoBus.afterArticle.scanToShareGalleryAlt": [
          "Scan to share – Arienzo bus guide QR or card",
          "Bar Internazionale area and Chiesa Nuova bus stop",
          "Example bus route context for Arienzo stop",
        ],
      });

      await renderRoute({ lang: "it" });

      expect(screen.getByRole("heading", { level: 2, name: "Scan to Share" })).toBeInTheDocument();
      const gallery = screen.getByTestId("image-gallery");
      const alts = within(gallery).getAllByRole("img").map((img) => img.getAttribute("alt"));
      expect(alts).toEqual([
        "Alt 1",
        "Bar Internazionale area and Chiesa Nuova bus stop",
        "Example bus route context for Arienzo stop",
      ]);
    });
  });

  it("honours translated scan-to-share heading and alt text", async () => {
    await withGuideMocks("hostelBriketteToArienzoBus", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "content.hostelBriketteToArienzoBus.afterArticle.scanToShareHeading": "Comparte esta guía",
        "content.hostelBriketteToArienzoBus.afterArticle.scanToShareGalleryAlt": ["Alt uno", "Alt dos", "Alt tres"],
      });

      await renderRoute({ lang: "en" });

      expect(screen.getByRole("heading", { level: 2, name: "Comparte esta guía" })).toBeInTheDocument();
      const gallery = screen.getByTestId("image-gallery");
      const alts = within(gallery).getAllByRole("img").map((img) => img.getAttribute("alt"));
      expect(alts).toEqual(["Alt uno", "Alt dos", "Alt tres"]);
    });
  });
});