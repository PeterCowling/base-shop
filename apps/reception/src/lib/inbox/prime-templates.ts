/**
 * Static template data module for Prime guest message replies.
 *
 * Templates are derived from the Prime Q&A engine (answerComposer.ts) and
 * provide bilingual (EN/IT) pre-written answers staff can select when replying
 * to common guest questions through the reception inbox.
 */

export type PrimeTemplateCategory =
  | "booking"
  | "experiences"
  | "food"
  | "transport"
  | "bag_drop";

export type PrimeTemplateLink = {
  label: string;
  href: string;
};

export type PrimeTemplate = {
  id: string;
  category: PrimeTemplateCategory;
  keywords: string[];
  answer: {
    en: string;
    it: string;
  };
  links: PrimeTemplateLink[];
};

const TEMPLATES: PrimeTemplate[] = [
  {
    id: "booking",
    category: "booking",
    keywords: ["booking", "check in", "check-in", "check out", "checkout", "status"],
    answer: {
      en: "Use Booking Details to check your stay status, room assignment, and available actions.",
      it: "Usa i Dettagli Prenotazione per controllare lo stato del soggiorno, l'assegnazione della camera e le azioni disponibili.",
    },
    links: [
      { label: "Booking details", href: "/booking-details" },
      { label: "Find my stay", href: "/find-my-stay" },
    ],
  },
  {
    id: "extension",
    category: "booking",
    keywords: ["extend", "extension", "stay longer"],
    answer: {
      en: "Submit an extension request in Booking Details. Reception receives it immediately.",
      it: "Invia una richiesta di prolungamento nei Dettagli Prenotazione. La reception la riceve immediatamente.",
    },
    links: [
      { label: "Request extension", href: "/booking-details" },
    ],
  },
  {
    id: "experiences",
    category: "experiences",
    keywords: ["activity", "activities", "experience", "event", "tour"],
    answer: {
      en: "Open Activities to see what is live or upcoming, then mark attendance when an event starts.",
      it: "Apri le Attivita per vedere cosa e in programma, poi segna la partecipazione quando inizia un evento.",
    },
    links: [
      { label: "Activities", href: "/activities" },
      { label: "Positano guide", href: "/positano-guide?topic=activities" },
    ],
  },
  {
    id: "food",
    category: "food",
    keywords: ["breakfast", "drink", "bar", "meal", "food"],
    answer: {
      en: "If your booking includes meals, you can place or edit breakfast and evening drink orders in Prime.",
      it: "Se la prenotazione include i pasti, puoi effettuare o modificare gli ordini per la colazione e il drink serale su Prime.",
    },
    links: [
      { label: "Breakfast order", href: "/complimentary-breakfast" },
      { label: "Evening drink order", href: "/complimentary-evening-drink" },
    ],
  },
  {
    id: "bag_drop",
    category: "bag_drop",
    keywords: ["bag", "luggage", "drop"],
    answer: {
      en: "After checkout, you can request bag drop and track request status directly in Prime.",
      it: "Dopo il checkout, puoi richiedere il deposito bagagli e seguire lo stato della richiesta direttamente su Prime.",
    },
    links: [
      { label: "Bag storage", href: "/bag-storage" },
    ],
  },
  {
    id: "transport",
    category: "transport",
    keywords: ["bus", "ferry", "taxi", "how to get", "get to", "transport", "around", "where to go"],
    answer: {
      en: "Use the Positano Guide for transport and local recommendations, with links to canonical Brikette pages.",
      it: "Usa la Guida di Positano per trasporti e consigli locali, con link alle pagine ufficiali di Brikette.",
    },
    links: [
      { label: "Positano guide", href: "/positano-guide?topic=transport" },
      { label: "How to get here", href: "https://www.hostelbrikette.com/en/how-to-get-here" },
    ],
  },
];

/**
 * Match templates against a query string using keyword matching.
 * Returns templates ranked by the number of keyword hits, descending.
 * Returns an empty array for empty or whitespace-only input.
 */
export function matchTemplates(query: string): PrimeTemplate[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const scored: Array<{ template: PrimeTemplate; score: number }> = [];

  for (const template of TEMPLATES) {
    let score = 0;
    for (const keyword of template.keywords) {
      if (normalized.includes(keyword)) {
        score++;
      }
    }
    if (score > 0) {
      scored.push({ template, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((entry) => entry.template);
}

/**
 * Return all templates. Useful for browse mode.
 */
export function allTemplates(): PrimeTemplate[] {
  return [...TEMPLATES];
}

/**
 * Look up a single template by ID.
 */
export function getTemplateById(id: string): PrimeTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/**
 * Format a template answer with links appended as readable lines.
 * Used when populating the draft textarea.
 */
export function formatTemplateForDraft(
  template: PrimeTemplate,
  locale: "en" | "it",
): string {
  const answer = template.answer[locale];
  if (template.links.length === 0) {
    return answer;
  }

  const linkLines = template.links.map(
    (link) => `${link.label}: ${link.href}`,
  );
  return `${answer}\n\n${linkLines.join("\n")}`;
}
