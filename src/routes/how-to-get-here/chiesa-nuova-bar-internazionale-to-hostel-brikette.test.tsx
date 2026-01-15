import "@testing-library/jest-dom";
import { within } from "@testing-library/react";
import { renderRoute } from "@tests/renderers";
import { findJsonLdByType } from "@tests/jsonld";
import { expectRouteHeadBasics } from "@tests/head";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  createTranslator,
  resetGuideTestState,
  setCurrentLanguage,
  setTranslations,
} from "@/routes/guides/__tests__/guides.test-utils";
import { primeGuideNamespaces, withGuideSuspenseHarness } from "@tests/guideSuspenseHarness";

import ChiesaNuovaArrivalsPage, {
  links as chiesaLinks,
  meta as chiesaMeta,
} from "./chiesa-nuova-bar-internazionale-to-hostel-brikette";
import { GUIDE_KEY } from "./chiesaNuovaArrivals/constants";

const buildTranslations = (locale: "en" | "de") =>
  createTranslator(locale, ["guides"]);

describe("Chiesa Nuova arrivals guide", () => {
  beforeAll(() => {
    primeGuideNamespaces("en");
    primeGuideNamespaces("de");
  });

  beforeEach(() => {
    resetGuideTestState();
  });

  const renderGuide = async (route: string) => {
    const lang = route.split("/")[1] || "en";
    return withGuideSuspenseHarness(async () => {
      const view = renderRoute(
        {
          default: ChiesaNuovaArrivalsPage,
          meta: chiesaMeta,
          links: chiesaLinks,
        },
        {
          route,
          loaderData: { lang },
        },
      );
      await view.ready?.();
      return view;
    });
  };

  it("renders structured content with knee-friendly links and HowTo JSON-LD", async () => {
    setTranslations("en", "guides", {
      content: {
        [GUIDE_KEY]: {
          seo: { title: "Chiesa Nuova arrivals" },
          intro: ["Intro copy"],
          sections: [
            {
              id: "before",
              title: "Before you head out",
              body: ["Body copy"],
            },
          ],
          beforeList: ["Bring cash"],
          stepsList: ["Follow the road"],
          howtoSteps: ["Walk carefully"],
          kneesList: ["Mind the slope"],
          kneesDockPrefix: "Dock → hostel",
          kneesDockLinkLabel: "Dock → hostel",
          kneesPorterPrefix: "Porter service",
          kneesPorterLinkLabel: "Porter service",
          tocTitle: "On this page",
          faqs: [{ q: "Is there a sidewalk the whole way?", a: ["Yes"] }],
          image: { alt: "Chiesa Nuova SITA stop outside Bar Internazionale", caption: "" },
          tocItems: [{ href: "#before", label: "Before" }],
        },
      },
    });
    setTranslations("de", "guidesFallback", {
      labels: {
        before: "Before",
        steps: "Steps",
        knees: "Knees",
        faqs: "FAQs",
        onThisPage: "On this page",
      },
    });
    setTranslations("en", "guidesFallback", {
      labels: {
        before: "Before you head out",
        steps: "Steps",
        knees: "Knees",
        faqs: "FAQs",
        onThisPage: "On this page",
      },
    });

    setCurrentLanguage("en");

    setCurrentLanguage("de");

    const { container, getByRole, getByText } = await renderGuide(
      "/en/how-to-get-here/chiesa-nuova-bar-internazionale-to-hostel-brikette",
    );
    expectRouteHeadBasics({ expectArticle: true });

    expect(getByRole("heading", { level: 1, name: "Chiesa Nuova arrivals" })).toBeInTheDocument();
    expect(getByRole("heading", { level: 2, name: /before you head out/i })).toBeInTheDocument();

    const article = container.querySelector("article.prose");
    expect(article).toBeTruthy();
    const articleWithin = within(article as HTMLElement);

    expect(
      articleWithin.getByRole("img", { name: /chiesa nuova sita stop outside bar internazionale/i }),
    ).toBeInTheDocument();

    const dockLink = articleWithin.getByRole("link", { name: /dock → hostel/i });
    expect(dockLink.getAttribute("href")).toContain(
      "/en/how-to-get-here/ferry-dock-to-hostel-brikette-with-luggage",
    );
    const porterLink = articleWithin.getByRole("link", { name: /porter service/i });
    expect(porterLink.getAttribute("href")).toContain("/en/guides/porter-service-positano");

    expect(getByText(/Is there a sidewalk the whole way/i)).toBeInTheDocument();

    expect(findJsonLdByType("HowTo")).toBeTruthy();
  });

  it("uses explicit tocItems and omits optional knee links when translations skip them", async () => {
    setTranslations("de", "guides", {
      content: {
        [GUIDE_KEY]: {
          tocItems: [{ href: "#custom", label: "Custom anchor" }],
          kneesDockPrefix: "",
          kneesPorterPrefix: "",
          kneesDockLinkLabel: "",
          kneesPorterLinkLabel: "",
          kneesList: [],
          seo: { title: "Chiesa Nuova arrivals (DE)" },
          intro: ["Intro copy"],
          sections: [{ id: "before", title: "Before you head out", body: ["Body copy"] }],
          beforeList: [],
          stepsList: [],
          howtoSteps: [],
          faqs: [],
          tocTitle: "On this page",
        },
      },
    });

    const { container, getByRole, getByTestId } = await renderGuide(
      "/de/how-to-get-here/chiesa-nuova-bar-internazionale-to-hostel-brikette",
    );
    expectRouteHeadBasics({ expectArticle: true });

    const tocNav = getByTestId("toc");
    expect(tocNav.textContent).toContain("Custom anchor");

    const article = container.querySelector("article.prose");
    expect(article).toBeTruthy();
    const articleWithin = within(article as HTMLElement);

    expect(articleWithin.queryByRole("link", { name: /dock → hostel/i })).toBeNull();
    expect(articleWithin.queryByRole("link", { name: /porter service/i })).toBeNull();
  });
});