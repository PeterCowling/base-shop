// file path: src/locales/guides.stub/content/capriDayTrip.ts
// -----------------------------------------------------------------------------
// Single-purpose stub: Day trip to Capri from Positano
// -----------------------------------------------------------------------------

 

export const capriDayTrip = {
  seo: {
    title: "Day trip to Capri from Positano",
    description: "How to plan a day trip: ferries, timing, and must-see areas.",
  },
  linkLabel: "Day trip to Capri from Positano",
  intro: ["Start early, pack light, and prioritise the viewpoints you care about most."],
  sections: [],
  toc: [],
  faqsTitle: "FAQs",
  faqs: [
    { q: "Do I need to prebook tickets?", a: ["Reserve morning ferries in high season."] },
    { q: "Can I include the Blue Grotto?", a: ["Confirm it's operating before joining the queue."] },
  ],
  galleryTitle: "Photo gallery",
  gallery: {
    items: {
      monteSolaro: { alt: "View from Monte Solaro", caption: "Monte Solaro overview" },
      gardensOfAugustus: { alt: "Gardens of Augustus, Capri", caption: "Gardens of Augustus" },
    },
  },
  howTo: { steps: [{ name: "Check seasonal ferries", text: "Confirm departures and last returns." }] },
} as const;

 

