import "@testing-library/jest-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderRoute } from "@tests/renderers";
import { findJsonLdByType } from "@tests/jsonld";
import { expectRouteHeadBasics } from "@tests/head";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { resetGuideTestState, setCurrentLanguage, setTranslations } from "@/routes/guides/__tests__/guides.test-utils";
import { primeGuideNamespaces, withGuideSuspenseHarness } from "@tests/guideSuspenseHarness";
import { primeGuideNamespaces, withGuideSuspenseHarness } from "@tests/guideSuspenseHarness";

import { GUIDE_KEY } from "./ferryDockToBrikette/constants";
import FerryDockGuide, {
  clientLoader,
  links as ferryDockLinks,
  meta as ferryDockMeta,
} from "./ferry-dock-to-hostel-brikette-with-luggage";

vi.mock("@/components/images/CfImage", () => ({
  __esModule: true,
  CfImage: ({ alt }: { alt: string }) => <img data-testid="guide-hero" alt={alt} />,
  default: ({ alt }: { alt: string }) => <img data-testid="guide-hero" alt={alt} />,
}));


const LABELS = {
  before: "Before you head out",
  steps: "Steps",
  knees: "Knees",
  faqs: "FAQs",
  onThisPage: "On this page",
} as const;

const BASE_GUIDE_CONTENT = {
  seo: { title: "Ferry dock to Hostel Brikette" },
  intro: [
    "Follow [these directions](https://www.google.com/maps/dir/?api=1&destination=hostel+brikette+positano) for live turns.",
    "Give yourself extra time if you're carrying luggage.",
  ],
  sections: [
    {
      id: "route",
      title: "Route overview",
      body: ["Walk past the porters, then head up Via Marconi towards the SITA stop."],
    },
  ],
  beforeList: ["Check ferry delays before you leave the dock."],
  stepsList: ["Climb the short staircase by the taxi stand.", "Follow Via Marconi uphill to the hostel."],
  kneesList: ["Pause at every landing to catch your breath."],
  kneesDockPrefix: "Need a porter?",
  kneesDockLinkLabel: "Porter services",
  kneesPorterPrefix: "Need help with luggage?",
  kneesPorterLinkLabel: "Hire a porter",
  faqs: [
    {
      q: "Where do I buy porter tickets?",
      a: ["Use the kiosk near the dock entrance or speak with the dispatcher."],
    },
  ],
  faqsTitle: "FAQs",
  toc: [{ href: "#route", label: "Route overview" }],
  tocTitle: "On this page",
  howtoSteps: ["Follow Via Marconi", "Use the railing on steep sections"],
} as const;

const BASE_FALLBACK_CONTENT = {
  intro: BASE_GUIDE_CONTENT.intro,
  sections: BASE_GUIDE_CONTENT.sections,
  beforeList: BASE_GUIDE_CONTENT.beforeList,
  stepsList: BASE_GUIDE_CONTENT.stepsList,
  kneesList: BASE_GUIDE_CONTENT.kneesList,
  kneesDockPrefix: BASE_GUIDE_CONTENT.kneesDockPrefix,
  kneesDockLinkLabel: BASE_GUIDE_CONTENT.kneesDockLinkLabel,
  kneesPorterPrefix: BASE_GUIDE_CONTENT.kneesPorterPrefix,
  kneesPorterLinkLabel: BASE_GUIDE_CONTENT.kneesPorterLinkLabel,
  faqs: BASE_GUIDE_CONTENT.faqs,
  faqsTitle: BASE_GUIDE_CONTENT.faqsTitle,
  toc: BASE_GUIDE_CONTENT.toc,
  howtoSteps: BASE_GUIDE_CONTENT.howtoSteps,
};

function seedGuideContent(lang: "en" | "it", overrides?: Record<string, unknown>) {
  setTranslations(lang, "guides", {
    content: {
      [GUIDE_KEY]: JSON.parse(
        JSON.stringify({
          ...BASE_GUIDE_CONTENT,
          ...(overrides ?? {}),
        }),
      ),
    },
  });
}

function seedGuideFallback(lang: "en" | "it", overrides?: Record<string, unknown>) {
  setTranslations(lang, "guidesFallback", {
    labels: LABELS,
    [GUIDE_KEY]: JSON.parse(
      JSON.stringify({
        ...BASE_FALLBACK_CONTENT,
        ...(overrides ?? {}),
      }),
    ),
  });
}

describe("Ferry dock arrivals guide", () => {
  beforeAll(() => {
    primeGuideNamespaces("en");
    primeGuideNamespaces("it");
  });

  beforeEach(() => {
    resetGuideTestState();
    seedGuideContent("en");
    seedGuideFallback("en");
  });

  const renderGuide = async (route: string) =>
    withGuideSuspenseHarness(async () => {
      const langSegment = route.split("/")[1] || "en";
      const view = renderRoute(
        { default: FerryDockGuide, meta: ferryDockMeta, links: ferryDockLinks },
        { route, loaderData: { lang: langSegment as AppLanguage } },
      );
      await view.ready?.();
      return view;
    });

  it("renders the ferry arrivals guide with linked directions and FAQ content", async () => {
    setCurrentLanguage("en");

    const { container, getByRole, getAllByRole, getAllByTestId } = await renderGuide(
      "/en/how-to-get-here/ferry-dock-to-hostel-brikette-with-luggage",
    );
    expectRouteHeadBasics({ expectArticle: true });

    expect(getByRole("heading", { level: 1, name: /ferry dock/i })).toBeInTheDocument();
    expect(getAllByTestId("toc").length).toBeGreaterThan(0);
    expect(getAllByRole("heading", { level: 2 })).not.toHaveLength(0);

    const hero = container.querySelector('img[data-testid="guide-hero"]');
    expect(hero).toBeNull();

    const directionsLink = getByRole("link", { name: /these directions/i });
    expect(directionsLink).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
    expect(directionsLink).toHaveAttribute("target", "_blank");

    const relatedNode = container.querySelector('[data-testid="related-guides"]');
    expect(relatedNode).not.toBeNull();
    const relatedItems = JSON.parse(relatedNode?.getAttribute("data-items") ?? "[]");
    expect(Array.isArray(relatedItems)).toBe(true);
    expect(relatedItems.some((item: { key?: string }) => item?.key === "porterServices")).toBe(true);

    expect(findJsonLdByType("HowTo")).toBeTruthy();
    const faqJson = container.querySelector('[data-testid="faq-json-ferryDockToBrikette"]');
    expect(faqJson).not.toBeNull();
  });

  it("falls back to guide defaults when locale content is sparse", async () => {
    seedGuideContent("it", {
      intro: ["Benvenuti a Positano!"],
      sections: [],
      toc: [],
      tocTitle: "",
      howtoSteps: [],
      stepsList: ["Segui la strada principale"],
      kneesList: [],
      kneesDockPrefix: "",
      kneesDockLinkLabel: "",
      kneesPorterPrefix: "",
      kneesPorterLinkLabel: "",
      faqs: [],
    });
    seedGuideFallback("it");
    setCurrentLanguage("it");

    const { container, getAllByTestId } = await renderGuide(
      "/it/how-to-get-here/ferry-dock-to-hostel-brikette-with-luggage",
    );
    expectRouteHeadBasics({ expectArticle: true });
    expect(getAllByTestId("toc").length).toBeGreaterThan(0);
    expect(container.querySelector("#steps")?.textContent).toMatch(/Segui la strada principale/i);

    const howTo = findJsonLdByType("HowTo");
    expect(howTo).toBeTruthy();
  });
});

describe("ferry dock clientLoader", () => {
  it("preloads namespaces and syncs language", async () => {
    const args = {
      request: new Request(
        "https://example.com/en/how-to-get-here/ferry-dock-to-hostel-brikette-with-luggage",
      ),
    } as any;

    const result = await clientLoader(args);
    expect(result).toEqual({ lang: "en" });
  });

  it("updates fallback language when changeLanguage is unavailable", async () => {
    const originalChangeLanguage = i18n.changeLanguage as unknown;
    const originalLanguage = (i18n as { language?: string }).language;
    (i18n as { changeLanguage?: unknown }).changeLanguage = undefined;
    (i18n as { language?: string }).language = undefined;

    const args = {
      request: new Request(
        "https://example.com/de/how-to-get-here/ferry-dock-to-hostel-brikette-with-luggage",
      ),
    } as any;

    const result = await clientLoader(args);
    expect(result).toEqual({ lang: "de" });

    (i18n as { changeLanguage?: unknown }).changeLanguage = originalChangeLanguage as any;
    (i18n as { language?: string }).language = originalLanguage;
  });
});