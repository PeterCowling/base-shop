// file path: src/locales/guides.stub/content/cheapEats.ts
// -----------------------------------------------------------------------------
// Single-purpose stub: Cheap Eats in Positano
// -----------------------------------------------------------------------------

/* eslint-disable ds/no-hardcoded-copy -- TECH-000 */

export const cheapEats = {
  seo: {
    title: "Cheap Eats in Positano",
    description: "Budget-friendly bites and where to find them in Positano.",
  },
  linkLabel: "Cheap Eats in Positano",
  intro: ["Positano has plenty of affordable bites if you know where to look."],
  sections: [
    { id: "grab", title: "Grab-and-go staples", body: ["Pizza al taglio, panini, and fresh fruit."] },
  ],
  recommendationsTitle: "Where to eat",
  recommendations: [
    { name: "Collina Bakery", address: "Via Pasitea", blurb: "Great value pastries and panini." },
  ],
  gallery: {
    title: "Photo gallery",
    items: [
      { alt: "Picnic with Positano view", caption: "Picnic with a view", src: "/img/cheap-eats-picnic.jpg" },
    ],
  },
} as const;

/* eslint-enable ds/no-hardcoded-copy -- TECH-000 */

