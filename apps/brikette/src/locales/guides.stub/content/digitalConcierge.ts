// file path: src/locales/guides.stub/content/digitalConcierge.ts
// -----------------------------------------------------------------------------
// Single-purpose stub: Digital Concierge Service
// -----------------------------------------------------------------------------

 

export const digitalConcierge = {
  seo: {
    title: "Digital Concierge Service at Hostel Brikette",
    description: "Get local tips, book experiences, and get travel help through our digital concierge service.",
  },
  linkLabel: "Digital Concierge",
  intro: [
    "Our digital concierge service helps you navigate the Amalfi Coast like a local. Get recommendations, book experiences, and solve travel problems on the go.",
  ],
  sections: [
    {
      id: "how-it-works",
      title: "How it works",
      body: [
        "Message us anytime through WhatsApp or our app. We respond quickly with personalized advice based on your preferences and budget.",
      ],
    },
    {
      id: "what-we-help-with",
      title: "What we can help with",
      body: [
        "Restaurant reservations, boat tour bookings, hiking trail conditions, ferry schedules, and last-minute itinerary changes.",
      ],
    },
    {
      id: "local-knowledge",
      title: "Local knowledge",
      body: [
        "Our team lives here year-round. We know which beaches are crowded, where to find the best limoncello, and how to avoid tourist traps.",
      ],
    },
  ],
  gallery: {
    title: "Concierge in action",
    items: [
      { alt: "Guest receiving travel advice", caption: "Personalized recommendations", src: "/img/concierge-help.jpg" },
    ],
  },
} as const;

 
