// file path: src/locales/guides.stub/content/boatTours.ts
// -----------------------------------------------------------------------------
// Single-purpose stub: Boat tours in Positano
// -----------------------------------------------------------------------------

/* eslint-disable ds/no-hardcoded-copy -- TECH-000 */

export const boatTours = {
  seo: {
    title: "Boat tours in Positano",
    description:
      "Private and group boat tours: what to expect, pricing ranges, and booking tips in season.",
  },
  linkLabel: "Boat tours in Positano",
  intro: [
    "Boat tours let you trace the Amalfi Coast cliffs without fighting road traffic; book ahead in peak months and keep a weather backup.",
  ],
  sections: [
    { id: "group-tours", title: "Group tours & shared boats", body: ["€85–€120 per person in July–August."] },
  ],
  faqs: [{ q: "Do I need to pre-book?", a: ["Yes in May–September."] }],
  galleryHeading: "Photo gallery",
  gallery: {
    primaryAlt: "Boat cruising along the Positano coast",
    primaryCaption: "Cruising the coast",
    secondaryAlt: "Swim stop near Positano cliffs",
    secondaryCaption: "Swim stop",
  },
} as const;

/* eslint-enable ds/no-hardcoded-copy -- TECH-000 */

