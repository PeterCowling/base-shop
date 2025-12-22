// file path: src/locales/guides.stub/content/beachHoppingAmalfi.ts
// -----------------------------------------------------------------------------
// Single-purpose stub: Beach hopping Amalfi Coast guide
// -----------------------------------------------------------------------------

/* eslint-disable ds/no-hardcoded-copy -- TECH-000 */

export const beachHoppingAmalfi = {
  seo: {
    title: "Beach hopping Amalfi Coast guide",
    description: "Compare beaches and plan shared or private boats.",
  },
  intro: ["Trace the coast by boat or bus and pick calmer coves."],
  // Keep sections empty in stub; split content can hydrate in FS mode.
  sections: [],
  faqs: [{ q: "Do I need to pre-book?", a: ["Yes in peak months."] }],
  galleryHeading: "Photo gallery",
  gallery: {
    primaryAlt: "Boat cruising along the Positano coast",
    primaryCaption: "Cruising the coast",
    secondaryAlt: "Swim stop near Positano cliffs",
    secondaryCaption: "Swim stop",
  },
} as const;

/* eslint-enable ds/no-hardcoded-copy -- TECH-000 */

