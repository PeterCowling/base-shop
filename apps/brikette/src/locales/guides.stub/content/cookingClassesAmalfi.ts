// file path: src/locales/guides.stub/content/cookingClassesAmalfi.ts
// -----------------------------------------------------------------------------
// Single-purpose stub: Cooking Classes on the Amalfi Coast
// -----------------------------------------------------------------------------


export const cookingClassesAmalfi = {
  seo: {
    title: "Cooking Class Experiences on the Amalfi Coast",
    description: "What classes are like, what you’ll cook, and how to choose one.",
  },
  linkLabel: "Cooking Class Experiences on the Amalfi Coast",
  intro: [
    "Hands-on Amalfi Coast cooking classes pair sfusato lemons, fresh pasta, and family recipes in small kitchens with a view.",
  ],
  sections: [
    { id: "flow", title: "How a typical class flows", body: ["Cook two or three courses, then share a meal."] },
  ],
  faqs: [
    {
      q: "Do I need to book in advance?",
      a: [
        "Yes — reserve in season (May–September). Small classes fill quickly, especially weekends.",
      ],
    },
  ],
  fallback: {
    intro: ["Hands-on pasta, sauces, and lemon desserts; small groups and scenic kitchens in season."],
    toc: [
      { href: "#what", label: "What to expect" },
      { href: "#choose", label: "How to choose" },
    ],
    sections: [
      { id: "what", title: "What to expect", body: ["Hands-on pasta, sauces, and lemon desserts."] },
    ],
  },
} as const;


