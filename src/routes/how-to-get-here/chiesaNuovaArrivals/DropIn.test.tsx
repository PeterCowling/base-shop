import "@testing-library/jest-dom";
import { renderWithProviders } from "@tests/renderers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetGuideTestState,
  setTranslations,
} from "@/routes/guides/__tests__/guides.test-utils";
import * as articleLeadModule from "./articleLead";
import ChiesaNuovaArrivalDropIn from "./DropIn";
import { GUIDE_KEY } from "./constants";

const BASE_ROUTE = "/it/how-to/chiesa";
const FALLBACK_LABELS = {
  onThisPage: "Fallback on this page",
  before: "Fallback before",
  steps: "Fallback steps",
  knees: "Fallback knees",
  faqs: "Fallback faqs",
};

describe("ChiesaNuovaArrivalDropIn", () => {
  const renderArticleLeadSpy = vi.spyOn(articleLeadModule, "renderArticleLead");

  beforeEach(() => {
    resetGuideTestState();
    renderArticleLeadSpy.mockReset();
    renderArticleLeadSpy.mockReturnValue(<div data-testid="article-lead" />);

    setTranslations("it", "guidesFallback", {
      labels: FALLBACK_LABELS,
    });
    setTranslations("en", "guidesFallback", {
      labels: FALLBACK_LABELS,
    });
  });

  it("renders localized metadata and passes extras without a TOC to the article lead", () => {
    setTranslations("it", "guides", {
      content: {
        [GUIDE_KEY]: {
          intro: ["Localized intro"],
          sections: [{ id: "section-id", title: "Section title", body: ["Body copy"] }],
          faqs: [],
          seo: { title: "  Italian Title  ", description: " Italian description " },
          tocItems: [{ href: "#section-id", label: "Section title" }],
        },
      },
    });
    setTranslations("en", "guides", {
      content: {
        [GUIDE_KEY]: {
          seo: { title: "English Title", description: "English description" },
        },
      },
    });

    const view = renderWithProviders(<ChiesaNuovaArrivalDropIn lang="it" />, { route: BASE_ROUTE });

    expect(view.getByRole("heading", { level: 2, name: "Italian Title" })).toBeInTheDocument();
    expect(view.getByText("Italian description")).toBeInTheDocument();

    const [contextArg, extrasArg] = renderArticleLeadSpy.mock.calls[0]!;
    expect(contextArg.hasLocalizedContent).toBe(true);
    expect(extrasArg.tocItems).toEqual([]);
  });

  it("falls back to English SEO metadata when localized strings are empty", () => {
    setTranslations("it", "guides", {
      content: {
        [GUIDE_KEY]: {
          intro: [],
          sections: [],
          faqs: [],
          seo: {
            title: `content.${GUIDE_KEY}.seo.title`,
            description: "   ",
          },
        },
      },
    });
    setTranslations("en", "guides", {
      content: {
        [GUIDE_KEY]: {
          seo: { title: "English Title", description: "English description" },
        },
      },
    });

    const view = renderWithProviders(<ChiesaNuovaArrivalDropIn lang="it" />, { route: BASE_ROUTE });

    expect(view.getByRole("heading", { level: 2, name: "English Title" })).toBeInTheDocument();
    expect(view.getByText("English description")).toBeInTheDocument();

    const [contextArg] = renderArticleLeadSpy.mock.calls[0]!;
    expect(contextArg.hasLocalizedContent).toBe(false);
  });

  it("returns null when neither localized nor fallback metadata is available", () => {
    setTranslations("it", "guides", {
      content: {
        [GUIDE_KEY]: {
          intro: [],
          sections: [],
          faqs: [],
          seo: {
            title: `content.${GUIDE_KEY}.seo.title`,
            description: `content.${GUIDE_KEY}.seo.description`,
          },
        },
      },
    });
    setTranslations("en", "guides", {
      content: {
        [GUIDE_KEY]: {
          seo: {
            title: `content.${GUIDE_KEY}.seo.title`,
            description: `content.${GUIDE_KEY}.seo.description`,
          },
        },
      },
    });

    const { container } = renderWithProviders(<ChiesaNuovaArrivalDropIn lang="it" />, { route: BASE_ROUTE });
    expect(container).toBeEmptyDOMElement();
    expect(renderArticleLeadSpy).not.toHaveBeenCalled();
  });
});