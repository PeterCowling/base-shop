// file path: src/locales/guides.stub/content/parking.ts
// -----------------------------------------------------------------------------
// Single-purpose stub: Parking in Positano
// -----------------------------------------------------------------------------

 

export const parking = {
  seo: {
    title: "Parking in Positano",
    description: "Where to park your car in Positano",
  },
  intro: [
    "Parking is scarce; plan garages early or park outside town.",
  ],
  sections: [
    { id: "garages", title: "Private garages in town", body: ["Reserve in advance in peak months."] },
    { id: "drop-off", title: "Drop-off and payment routine", body: ["Unload quickly at short-stay lay-bys."] },
    { id: "park-elsewhere", title: "Cheaper parking outside Positano", body: ["Consider Sorrento/Meta lots with bus connections."] },
  ],
  faqs: [
    { q: "Can I street-park in Positano?", a: ["Rarely; rely on garages or park outside town."] },
  ],
  tocTitle: "On this page",
  faqsTitle: "FAQs",
} as const;

 

