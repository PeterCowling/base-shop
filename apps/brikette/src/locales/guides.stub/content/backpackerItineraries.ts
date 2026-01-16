// file path: src/locales/guides.stub/content/backpackerItineraries.ts
// -----------------------------------------------------------------------------
// Single-purpose stub: Backpacker itineraries (Amalfi Coast)
// -----------------------------------------------------------------------------


export const backpackerItineraries = {
  seo: {
    title: "Backpacker itineraries on the Amalfi Coast",
    description: "Practical, budget-first routes for 2 to 7 days without a car.",
  },
  linkLabel: "Backpacker itineraries",
  intro: [
    "Practical day-by-day plans that hit the highlights without blowing your budget.",
  ],
  day1Title: "1 day: essentials",
  day1: [
    "Morning: Spiaggia Grande lookouts → Fornillo via coastal path",
    "Lunch: panini/pizza al taglio near Chiesa Nuova to save",
    "Sunset: terrace viewpoints near the hostel",
  ],
  day2Title: "2 days: add Path of the Gods",
  day2: [
    "Day 1 as above",
    "Day 2: SITA to Nocelle → Sentiero degli Dei segments → beach cooldown",
  ],
  day3Title: "3 days: island or Amalfi combo",
  day3: [
    "Option A: Day trip to Capri (early ferry) with DIY walking loop",
    "Option B: Amalfi + Ravello via bus; Villa Rufolo gardens then gelato on the Duomo steps",
  ],
  savingsTitle: "Money-saving tips",
  savings: [
    "Travel in shoulder seasons; use SITA buses and walk between viewpoints.",
    "Stay in dorms, cook simple breakfasts, and picnic at viewpoints for sunset.",
  ],
  foodTitle: "Cheap eats",
  foodText: "Find panini, pizza al taglio, and supermarket salads around mid-town; avoid waterfront price spikes.",
  transportTitle: "Transport tips",
  transportCompareLabel: "Compare routes:",
  transportCompareLinks: [
    { key: "naplesPositano", label: "Naples → Positano" },
    { key: "salernoPositano", label: "Salerno → Positano" },
  ],
  transportFerryPrefix: "Check ",
  transportFerryLinkLabel: "ferry schedules",
  transportFerrySuffix: " and weather; buses are cheaper.",
  faqsTitle: "FAQs",
  faqs: [
    { q: "What’s the best 1-day plan?", a: ["Start at Spiaggia Grande, hike to Fornillo, sunset from Chiesa Nuova terrace, dinner with hostel friends."] },
  ],
} as const;


