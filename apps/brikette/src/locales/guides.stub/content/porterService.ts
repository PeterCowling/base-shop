// file path: src/locales/guides.stub/content/porterService.ts
// -----------------------------------------------------------------------------
// Single-purpose stub: Porter service in Positano
// -----------------------------------------------------------------------------

/* eslint-disable ds/no-hardcoded-copy -- TECH-000 */

export const porterService = {
  seo: {
    title: "Porter service in Positano: what to know",
    description: "How porter services work, costs, and when to book.",
  },
  linkLabel: "Porter service in Positano",
  intro: ["A quick overview of porter services and rough pricing."],
  sections: [
    { id: "pricing", title: "Typical pricing", body: ["Expect per-bag fees; book ahead in peak months."] },
  ],
  faqs: [{ q: "Can I book on arrival?", a: ["Possible, but better to book ahead."] }],
} as const;

/* eslint-enable ds/no-hardcoded-copy -- TECH-000 */

