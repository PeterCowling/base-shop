export interface AssistantLink {
  label: string;
  href: string;
}

export interface AssistantAnswer {
  answer: string;
  category: 'booking' | 'experiences' | 'food' | 'transport' | 'bag_drop' | 'general';
  answerType: 'known' | 'fallback';
  links: AssistantLink[];
}

const ALLOWLISTED_HOSTS = new Set([
  'hostel-positano.com',
  'www.hostel-positano.com',
  'www.hostelbrikette.com',
  'hostelbrikette.com',
]);

const FALLBACK_LINK: AssistantLink = {
  label: 'Reception support',
  href: '/booking-details',
};

function isAllowlistedUrl(url: string): boolean {
  if (url.startsWith('/')) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return ALLOWLISTED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function sanitizeLinks(links: AssistantLink[]): AssistantLink[] {
  return links.filter((link) => isAllowlistedUrl(link.href));
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function composeAssistantAnswer(question: string): AssistantAnswer {
  const normalized = question.trim().toLowerCase();

  if (!normalized) {
    return {
      answer: 'Ask me anything about your stay, arrival, food options, or local activities.',
      category: 'general',
      answerType: 'fallback',
      links: [FALLBACK_LINK],
    };
  }

  if (includesAny(normalized, ['booking', 'check in', 'check-in', 'check out', 'checkout', 'status'])) {
    return {
      answer: 'Use Booking Details to check your stay status, room assignment, and available actions.',
      category: 'booking',
      answerType: 'known',
      links: sanitizeLinks([
        { label: 'Booking details', href: '/booking-details' },
        { label: 'Find my stay', href: '/find-my-stay' },
      ]),
    };
  }

  if (includesAny(normalized, ['extend', 'extension', 'stay longer'])) {
    return {
      answer: 'Submit an extension request in Booking Details. Reception receives it immediately.',
      category: 'booking',
      answerType: 'known',
      links: sanitizeLinks([
        { label: 'Request extension', href: '/booking-details' },
      ]),
    };
  }

  if (includesAny(normalized, ['activity', 'activities', 'experience', 'event', 'tour'])) {
    return {
      answer: 'Open Activities to see what is live or upcoming, then mark attendance when an event starts.',
      category: 'experiences',
      answerType: 'known',
      links: sanitizeLinks([
        { label: 'Activities', href: '/activities' },
        { label: 'Positano guide', href: '/positano-guide?topic=activities' },
      ]),
    };
  }

  if (includesAny(normalized, ['breakfast', 'drink', 'bar', 'meal', 'food'])) {
    return {
      answer: 'If your booking includes meals, you can place or edit breakfast and evening drink orders in Prime.',
      category: 'food',
      answerType: 'known',
      links: sanitizeLinks([
        { label: 'Breakfast order', href: '/complimentary-breakfast' },
        { label: 'Evening drink order', href: '/complimentary-evening-drink' },
      ]),
    };
  }

  if (includesAny(normalized, ['bag', 'luggage', 'drop'])) {
    return {
      answer: 'After checkout, you can request bag drop and track request status directly in Prime.',
      category: 'bag_drop',
      answerType: 'known',
      links: sanitizeLinks([
        { label: 'Bag storage', href: '/bag-storage' },
      ]),
    };
  }

  if (includesAny(normalized, ['bus', 'ferry', 'taxi', 'how to get', 'get to', 'transport', 'around', 'where to go'])) {
    return {
      answer: 'Use the Positano Guide for transport and local recommendations, with links to canonical Brikette pages.',
      category: 'transport',
      answerType: 'known',
      links: sanitizeLinks([
        { label: 'Positano guide', href: '/positano-guide?topic=transport' },
        { label: 'How to get here', href: 'https://www.hostelbrikette.com/en/how-to-get-here' },
      ]),
    };
  }

  return {
    answer:
      'I do not have a direct answer for that yet. Use Booking Details or ask reception for immediate help.',
    category: 'general',
    answerType: 'fallback',
    links: [FALLBACK_LINK],
  };
}

export function validateAssistantLinks(links: AssistantLink[]): boolean {
  return links.every((link) => isAllowlistedUrl(link.href));
}
