// file path: src/locales/guides.stub/content/budgetAccommodationBeyond.ts
// -----------------------------------------------------------------------------
// Single-purpose stub: Budget accommodation beyond Positano
// -----------------------------------------------------------------------------


export const budgetAccommodationBeyond = {
  seo: {
    title: "Budget Accommodation Beyond Positano",
    description: "Where to base for value (Sorrento, Salerno, Amalfi area) and trade-offs.",
  },
  intro: ["Value-friendly bases outside Positano with realistic transport trade-offs."],
  sections: [
    {
      id: "sorrento",
      title: "Sorrento",
      body: ["Good value base with frequent trains and ferries; easier late arrivals."],
    },
    {
      id: "salerno",
      title: "Salerno",
      body: ["Affordable and well connected; seasonal ferries sail to Amalfi and Positano."],
    },
    {
      id: "amalfi-area",
      title: "Amalfi area",
      body: ["Smaller towns can offer off-season bargains; monitor bus frequencies."],
    },
    {
      id: "tradeoffs",
      title: "Trade-offs",
      body: ["Longer commutes versus lower rates. For short stays, base in Positano to save time."],
    },
  ],
  faqs: [
    {
      q: "Is it worth commuting?",
      a: [
        "If you prioritise price and can handle longer transfers, yes — especially in shoulder season.",
      ],
    },
  ],
} as const;


