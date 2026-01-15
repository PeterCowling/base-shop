import { describe, expect, it } from "vitest";

import * as FerrySchedulesModule from "@/routes/guides/ferry-schedules";

import { buildContext, setTranslations } from "./_setup";

describe("buildFerrySchedulesGuideExtras – fallback chain", () => {
  it("falls back through locale, english, and static content when localized strings are blank", () => {
    setTranslations("guides", "en", {
      "labels.onThisPage": "On this page",
      "labels.tipsHeading": "Tips",
      "labels.faqsHeading": "FAQs",
      "labels.photoGallery": "Gallery",
    });

    setTranslations("guides", "fr", {
      "labels.tipsHeading": "  ",
      "content.ferrySchedules.intro": ["content.ferrySchedules.intro"],
      "content.ferrySchedules.sections": [
        { id: " ", title: " ", body: [] },
      ],
      "content.ferrySchedules.tips": ["content.ferrySchedules.tips"],
      "content.ferrySchedules.faqs": [],
      "content.ferrySchedules.galleryTitle": "  ",
      "content.ferrySchedules.tipsTitle": "  ",
      "content.ferrySchedules.faqsTitle": "  ",
      "content.ferrySchedules.toc": { tips: "content.ferrySchedules.toc.tips" },
    });

    setTranslations("guidesFallback", "fr", {
      "ferrySchedules.intro": ["  Salut  "],
      "ferrySchedules.sections": [],
      "ferrySchedules.tips": ["  "],
      "ferrySchedules.faqs": [],
      "ferrySchedules.gallery": [],
      "ferrySchedules.galleryTitle": "   ",
      "ferrySchedules.tipsTitle": "   ",
      "ferrySchedules.toc.gallery": "  Galerie FR  ",
      "ferrySchedules.toc.onThisPage": "   ",
    });

    setTranslations("guidesFallback", "en", {
      "ferrySchedules.sections": [
        { id: "tips", title: "", body: ["  Body EN  "] },
        { id: "schedule", title: " Schedule  ", body: [" First leg "] },
      ],
      "ferrySchedules.tips": ["  Conseils EN  "],
      "ferrySchedules.faqs": [
        { q: "  English Q  ", a: ["  English A  "] },
      ],
      "ferrySchedules.gallery": [
        { alt: "  Alt EN  " },
      ],
      "ferrySchedules.galleryTitle": "  Gallery EN  ",
      "ferrySchedules.tipsTitle": "  Tips EN  ",
      "ferrySchedules.toc.tips": "  Tips Toc EN  ",
    });

    const context = buildContext("fr");
    const extras = FerrySchedulesModule.buildFerrySchedulesGuideExtras(["hero", "secondary"], context);

    expect(extras.intro).toEqual(["Salut"]);
    expect(extras.sections).toEqual([
      { id: "tips", title: "", body: ["Body EN"] },
      { id: "schedule", title: "Schedule", body: ["First leg"] },
    ]);
    expect(extras.tips).toEqual(["Conseils EN"]);
    expect(extras.faqs).toEqual([
      {
        q: "Do ferries operate to Positano year-round?",
        a: ["Ferries are seasonal (typically April–October). In winter, buses/taxis are the primary options."],
      },
      {
        q: "Where can I check real-time ferry schedules?",
        a: ["Use operators’ sites (e.g., NLG, Travelmar, Alilauro) or aggregators like DirectFerries during summer."],
      },
      {
        q: "Which pier should I use in Positano?",
        a: ["The main pier is at Spiaggia Grande. Check your ticket for the exact boarding lane on busy days."],
      },
      {
        q: "How early should I arrive before departure?",
        a: ["Arrive 20–30 minutes early; queues are common in peak months (June–September)."],
      },
      {
        q: "Is the walk from the port to Hostel Brikette difficult?",
        a: ["It’s an uphill walk with many stairs. Consider a porter service or bus to Chiesa Nuova if carrying heavy bags."],
      },
    ]);
    expect(extras.tipsTitle).toBe("Tips EN");
    expect(extras.faqsTitle).toBe("Positano ferry FAQs");
    expect(extras.galleryTitle).toBe("Gallery EN");
    expect(extras.galleryItems).toEqual([
      { src: "hero", alt: "Alt EN", caption: undefined },
      { src: "secondary", alt: "Gallery", caption: undefined },
    ]);
    expect(extras.tocTitle).toBe("On this page");
    expect(extras.tocItems).toEqual([
      { href: "#tips", label: "tips" },
      { href: "#schedule", label: "Schedule" },
      { href: "#faqs", label: "FAQs" },
      { href: "#gallery", label: "Galerie FR" },
    ]);
  });
});
