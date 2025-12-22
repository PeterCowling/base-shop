// file path: src/locales/guides.stub/content/positanoBudget.ts
// -----------------------------------------------------------------------------
// Single-purpose stub: Positano on a budget
// -----------------------------------------------------------------------------

/* eslint-disable ds/no-hardcoded-copy -- TECH-000 */

export const positanoBudget = {
  seo: {
    title: "Positano on a budget",
    description: "Save on transport, food and views while enjoying Positano.",
  },
  heroAlt: "View over Positano from above",
  tocTitle: "On this page",
  faqsTitle: "FAQs",
  intro: [
    "Positano on a budget is doable: prioritise viewpoints, use buses, and plan ferries selectively.",
  ],
  sections: [
    { id: "essentials", title: "Essentials", body: ["Use SITA buses and pack a refillable bottle."] },
  ],
  costBreakdown: {
    title: "",
    slices: [
      { label: "Bed (dorm)", value: 40 },
      { label: "Food", value: 25 },
      { label: "Transport", value: 10 },
    ],
  },
  faqs: [
    { q: "Is Positano doable cheaply?", a: ["Yes with buses, walking, and shared meals."] },
  ],
} as const;

/* eslint-enable ds/no-hardcoded-copy -- TECH-000 */

