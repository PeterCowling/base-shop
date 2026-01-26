import "@testing-library/jest-dom";

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@tests/renderers";

import ExperiencesPageContent from "@/app/[lang]/experiences/ExperiencesPageContent";

const openModalSpy = jest.fn();

jest.mock("@/context/ModalContext", () => ({
  useOptionalModal: () => ({
    activeModal: null,
    modalData: null,
    openModal: openModalSpy,
    closeModal: jest.fn(),
  }),
}));

let searchParams = new URLSearchParams("");
let pathname = "/en/experiences";

jest.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  usePathname: () => pathname,
  useParams: () => ({ lang: "en" }),
}));

jest.mock("@/data/guides.index", () => ({
  GUIDES_INDEX: [
    {
      key: "pathOfTheGods",
      section: "experiences",
      status: "published",
      tags: ["hiking", "positano"],
    },
    {
      key: "positanoBeaches",
      section: "experiences",
      status: "published",
      tags: ["beaches", "positano"],
    },
  ],
}));

const experiencesPageCopy = {
  meta: {
    title: "Experiences at Hostel Brikette",
    description: "Sip terrace spritzes, join curated hikes, and chat with our concierge.",
  },
  hero: {
    eyebrow: "Experiences",
    title: "Sunsets, slow mornings, and local know-how",
    description: "Pair your stay with terrace drinks, curated hikes, and a digital concierge.",
    supporting: "Everything is open to registered guests.",
    primaryCta: "Book your stay",
    primaryCtaAria: "Book your stay at Hostel Brikette",
    secondaryCta: "Open the bar menu",
    secondaryCtaAria: "View the Hostel Brikette bar menu",
    breakfastCta: "View the breakfast menu",
    breakfastCtaAria: "View the breakfast menu",
    tertiaryCta: "Message the digital concierge",
    tertiaryCtaAria: "Message the digital concierge",
  },
  sections: {
    bar: {
      eyebrow: "Terrace bar",
      title: "Sunset terrace bar",
      description: "Spritzes, Campanian wines, and golden-hour views.",
      highlights: ["Signature spritzes", "Social nights", "Panoramic views"],
      imageAlt: "Terrace at sunset",
    },
    hikes: {
      eyebrow: "Guided hikes",
      title: "Guided hikes & day trips",
      description: "Plan Path of the Gods days with up-to-date tips.",
      highlights: ["Offline maps", "Staff-led walks", "Weather-friendly alternatives"],
      imageAlt: "Hiking above the Amalfi Coast",
    },
    concierge: {
      eyebrow: "Digital concierge",
      title: "Always-on digital concierge",
      description: "Real-time alerts and tailored ideas that match your pace.",
      highlights: ["Fast replies", "Ferry alerts", "Personal suggestions"],
      imageAlt: "Reception desk",
    },
  },
  guideCollections: {
    heading: "Go deeper with our experiences guides",
    description: "Itineraries, hikes, and cultural picks curated by our team.",
    taggedHeading: "Experiences about {{tag}}",
    taggedDescription: "These stories highlight {{tag}} moments.",
    empty: "We don’t have experience guides for {{tag}} yet.",
    clearFilter: "Show all experiences guides",
    cardCta: "Explore the {{guideTitle}} experience guide",
    directionsLabel: "Directions",
    filterHeading: "Filter experiences guides by topic",
    filterDescription: "Pick a topic to narrow the experiences we highlight.",
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        question: "Do I need to reserve experiences in advance?",
        answer: ["Most terrace evenings and hikes are confirmed on the day."],
      },
    ],
  },
  cta: {
    title: "Ready to plan your Amalfi Coast days?",
    subtitle: "Book your bed, skim the bar lineup, and tell us what you’d like to do.",
    buttons: {
      book: "Book now",
      events: "Bar & events",
      breakfast: "Breakfast menu",
      concierge: "Chat with the concierge",
    },
  },
} as const;

function getPathValue(root: unknown, path: string): unknown {
  const segments = path.split(".").filter(Boolean);
  let cursor: unknown = root;
  for (const segment of segments) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
}

function interpolate(template: string, options: Record<string, unknown> | undefined): string {
  if (!options) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    const value = options[key];
    return typeof value === "string" ? value : "";
  });
}

function createT(namespace: string) {
  return (key: string, options?: Record<string, unknown>) => {
    const source = namespace === "experiencesPage" ? experiencesPageCopy : undefined;
    if (!source) {
      if (options && typeof options.defaultValue === "string") return options.defaultValue;
      return key;
    }

    if (options?.returnObjects) {
      const raw = getPathValue(source, key);
      return raw === undefined ? key : raw;
    }

    const raw = getPathValue(source, key);
    if (typeof raw === "string") {
      return interpolate(raw, options);
    }

    if (options && typeof options.defaultValue === "string") return options.defaultValue;
    return key;
  };
}

jest.mock("react-i18next", () => ({
  useTranslation: (namespace?: string, opts?: { lng?: string }) => ({
    t: createT(namespace ?? "unknown"),
    i18n: undefined,
    ready: Boolean(opts?.lng),
  }),
}));

describe("<ExperiencesPageContent />", () => {
  beforeEach(() => {
    openModalSpy.mockClear();
    searchParams = new URLSearchParams("");
    pathname = "/en/experiences";
  });

  it("renders the hero and opens booking + contact modals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExperiencesPageContent lang="en" />);

    expect(
      screen.getByRole("heading", { name: /sunsets, slow mornings/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /book your stay/i }));
    expect(openModalSpy).toHaveBeenCalledWith("booking");

    await user.click(screen.getByRole("button", { name: /message the digital concierge/i }));
    expect(openModalSpy).toHaveBeenCalledWith("contact");
  });
});
