import { beforeEach, describe, expect, it } from "vitest";

import { buildGuideContext } from "@tests/guides/context";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";
import { renderWithProviders } from "@tests/renderers";
import { withGuideMocks } from "./guideTestHarness";

import type { GuideKey } from "@/routes.guides-helpers";

const ROUTE = "/en/guides/eco-friendly-travel-amalfi-coast";
const GUIDE_KEY: GuideKey = "ecoFriendlyAmalfi";

type TranslatorReturn = unknown;

const buildTranslator = (map: Record<string, TranslatorReturn>) => {
  return (key: string, options?: { defaultValue?: unknown; returnObjects?: boolean }) => {
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      return map[key];
    }
    if (options?.returnObjects) {
      return options.defaultValue ?? [];
    }
    return options?.defaultValue ?? "";
  };
};

describe("eco-friendly-travel-amalfi-coast route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("draws manifest-driven template props", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<any>();
    expect(props).toMatchObject({
      guideKey: GUIDE_KEY,
      metaKey: GUIDE_KEY,
      genericContentOptions: { showToc: true },
      alwaysProvideFaqFallback: true,
      suppressUnlocalizedFallback: true,
      relatedGuides: {
        items: [
          { key: "stayingFitAmalfi" },
          { key: "safetyAmalfi" },
          { key: "workAndTravelPositano" },
        ],
      },
    });
  });

  it("renders manual fallback content when localized data is empty", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);
    const props = getGuideTemplateProps<any>();

    const translator = buildTranslator({
      [`${GUIDE_KEY}.intro`]: ["  Respect the trails  ", 7],
      [`${GUIDE_KEY}.toc`]: [
        { href: "", label: " " },
        { href: " #parks ", label: " Parks " },
        { label: "Essentials" },
      ],
      [`${GUIDE_KEY}.sections`]: [
        { title: "  Trails  ", body: [" Stay on the path "] },
        { title: " ", items: ["ignored"] },
        { id: "custom", title: " Custom ", items: [" Bring water "] },
      ],
      [`${GUIDE_KEY}.faqs`]: [
        { q: "  What to pack?  ", a: [" Reusable bottle "] },
        { question: "Where to refill?", answer: ["Fountains", ""] },
        { q: "", a: [] },
      ],
      [`${GUIDE_KEY}.faqsTitle`]: "  Questions fréquentes  ",
    });

    const context = buildGuideContext({
      guideKey: GUIDE_KEY,
      metaKey: GUIDE_KEY,
      hasLocalizedContent: false,
      intro: [],
      sections: [],
      faqs: [],
      translateGuides: translator as any,
      translator: translator as any,
    });

    const element = props.articleExtras?.(context);
    expect(element).not.toBeNull();

    const view = render(<>{element}</>);
    expect(view.queryByTestId("generic-content")).toBeNull();
    expect(view.getByText("Respect the trails")).toBeInTheDocument();
    expect(view.getByText("Stay on the path")).toBeInTheDocument();
    expect(view.getByText("Custom")).toBeInTheDocument();
    expect(view.getByText("Bring water")).toBeInTheDocument();
    expect(view.getByText("Questions fréquentes")).toBeInTheDocument();

    const tocLinks = Array.from(view.getAllByRole("link")).map((link) => link.getAttribute("href"));
    expect(tocLinks).toEqual(["#s-0", "#parks", "#s-2"]);
  });
});