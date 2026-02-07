// file path: src/locales/guides.stub/content/terraceSunsets.ts
// -----------------------------------------------------------------------------
// Single-purpose stub: Terrace Bar Sunset Experience
// -----------------------------------------------------------------------------

 

export const terraceSunsets = {
  seo: {
    title: "Terrace Bar & Sunset Experience at Hostel Brikette",
    description: "Watch the sun set over the Amalfi Coast from our rooftop terrace bar with local wines and aperitivo.",
  },
  linkLabel: "Terrace Bar & Sunsets",
  intro: [
    "Our rooftop terrace offers one of the best sunset views in Positano. Grab a drink, find a spot, and watch the sky turn golden over the Mediterranean.",
  ],
  sections: [
    {
      id: "timing",
      title: "Best time to arrive",
      body: [
        "Arrive 30-45 minutes before sunset to secure the best seats. The terrace fills up quickly during peak season.",
      ],
    },
    {
      id: "drinks",
      title: "What to order",
      body: [
        "Try local Campanian wines or a classic Aperol Spritz. We also serve craft beers and non-alcoholic options.",
      ],
    },
    {
      id: "atmosphere",
      title: "The experience",
      body: [
        "Meet fellow travelers, share stories, and enjoy the golden hour. It's the perfect way to end a day of exploring the coast.",
      ],
    },
  ],
  gallery: {
    title: "Sunset moments",
    items: [
      { alt: "Sunset over Positano from the terrace", caption: "Golden hour views", src: "/img/terrace-sunset.jpg" },
    ],
  },
} as const;

 
