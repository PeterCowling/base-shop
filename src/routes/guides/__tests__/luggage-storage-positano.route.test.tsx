import { describe, expect, it, beforeEach, vi } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import {
  capturedFaqFallbacks,
  resetGuideTestState,
  setTranslations,
} from "./guides.test-utils";

const serviceStructuredDataMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/seo/ServiceStructuredData", () => ({
  __esModule: true,
  default: (props: unknown) => {
    serviceStructuredDataMock(props);
    return <div data-testid="service-structured" />;
  },
}));

describe("luggage storage Positano guide", () => {
  beforeEach(() => {
    resetGuideTestState();
    serviceStructuredDataMock.mockClear();
  });

  it("prefers localized structured content and surfaces service structured data", async () => {
    await withGuideMocks("luggageStorage", async ({ renderRoute, screen, setTranslations }) => {
      setTranslations("en", "guides", {
        "guides.meta.luggageStorage.title": "Luggage storage in Positano",
        "guides.meta.luggageStorage.description": "Where to stash your bags safely.",
        "content.luggageStorage.seo.title": "Luggage storage in Positano",
        "content.luggageStorage.seo.description": "Where to stash your bags safely.",
        "content.luggageStorage.intro": ["English intro"],
        "content.luggageStorage.toc": [{ href: "#overview", label: "Overview" }],
        "content.luggageStorage.sections": [{ id: "overview", title: "Overview", body: ["English overview"] }],
        "content.luggageStorage.faqs": [{ q: "English Q", a: ["English A"] }],
        "content.luggageStorage.faq": [{ q: "English fallback", a: "Use lockers" }],
        "content.luggageStorage.faqsTitle": "English FAQs",
        "content.luggageStorage.serviceType": "Porter service",
        "content.luggageStorage.areaServed": "Positano & Amalfi",
        "content.luggageStorage.heroAlt": "English hero alt",
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "labels.onThisPage": "On this page",
        "labels.faqsHeading": "FAQs",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
        guides: {
          meta: {
            luggageStorage: {
              title: "Luggage storage in Positano",
              description: "Where to stash your bags safely.",
            },
          },
        },
        content: {
          luggageStorage: {
            seo: {
              title: "Luggage storage in Positano",
              description: "Where to stash your bags safely.",
            },
            intro: ["English intro"],
            toc: [{ href: "#overview", label: "Overview" }],
            sections: [{ id: "overview", title: "Overview", body: ["English overview"] }],
            faqs: [{ q: "English Q", a: ["English A"] }],
            faq: [{ q: "English fallback", a: "Use lockers" }],
            faqsTitle: "English FAQs",
            serviceType: "Porter service",
            areaServed: "Positano & Amalfi",
            heroAlt: "English hero alt",
          },
        },
        labels: {
          homeBreadcrumb: "Home",
          guidesBreadcrumb: "Guides",
          onThisPage: "On this page",
          faqsHeading: "FAQs",
        },
        breadcrumbs: {
          home: "Home",
          guides: "Guides",
        },
      });

      setTranslations("it", "guides", {
        "guides.meta.luggageStorage.title": "Deposito bagagli a Positano",
        "guides.meta.luggageStorage.description": "Consigli pratici per lasciare i bagagli.",
        "content.luggageStorage.seo.title": "Deposito bagagli a Positano",
        "content.luggageStorage.seo.description": "Consigli pratici per lasciare i bagagli.",
        "content.luggageStorage.intro": ["Sfrutta i porter per arrivare senza stress."],
        "content.luggageStorage.toc": [
          { href: "  #overview ", label: "  Panoramica " },
          { href: "", label: "Ignora" },
        ],
        "content.luggageStorage.sections": [
          {
            id: "overview",
            title: "Soluzioni consigliate",
            body: ["Prenota il servizio in anticipo."],
          },
        ],
        "content.luggageStorage.faqs": [
          { q: "Quanto costa?", a: ["Dai 10€ ai 15€ a bagaglio."] },
          { q: "", a: ["Ignora"] },
        ],
        "content.luggageStorage.faqsTitle": "Domande frequenti",
        "content.luggageStorage.serviceType": "Deposito bagagli locale",
        "content.luggageStorage.areaServed": "Positano centro",
        "content.luggageStorage.heroAlt": "Deposito bagagli locale",
        "labels.onThisPage": "Su questa pagina",
        "labels.faqsHeading": "Domande frequenti",
        "labels.homeBreadcrumb": "Casa",
        "labels.guidesBreadcrumb": "Guide",
        "breadcrumbs.home": "Casa",
        "breadcrumbs.guides": "Guide",
        guides: {
          meta: {
            luggageStorage: {
              title: "Deposito bagagli a Positano",
              description: "Consigli pratici per lasciare i bagagli.",
            },
          },
        },
        content: {
          luggageStorage: {
            seo: {
              title: "Deposito bagagli a Positano",
              description: "Consigli pratici per lasciare i bagagli.",
            },
            intro: ["Sfrutta i porter per arrivare senza stress."],
            toc: [
              { href: "  #overview ", label: "  Panoramica " },
              { href: "", label: "Ignora" },
            ],
            sections: [
              {
                id: "overview",
                title: "Soluzioni consigliate",
                body: ["Prenota il servizio in anticipo."],
              },
            ],
            faqs: [
              { q: "Quanto costa?", a: ["Dai 10€ ai 15€ a bagaglio."] },
              { q: "", a: ["Ignora"] },
            ],
            faqsTitle: "Domande frequenti",
            serviceType: "Deposito bagagli locale",
            areaServed: "Positano centro",
            heroAlt: "Deposito bagagli locale",
          },
        },
        labels: {
          onThisPage: "Su questa pagina",
          faqsHeading: "Domande frequenti",
          homeBreadcrumb: "Casa",
          guidesBreadcrumb: "Guide",
        },
        breadcrumbs: {
          home: "Casa",
          guides: "Guide",
        },
      });

      await renderRoute({
        lang: "it",
        route: "/it/guides/luggage-storage-positano",
      });

      await expect(
        screen.findByRole("heading", { level: 1, name: /deposito bagagli/i }),
      ).resolves.toBeInTheDocument();

      const toc = screen.getByRole("navigation", { name: "Su questa pagina" });
      const tocLinks = Array.from(toc.querySelectorAll("a")).map((link) => ({
        href: link.getAttribute("href"),
        text: link.textContent,
      }));
      expect(tocLinks).toEqual([{ href: "#overview", text: "Panoramica" }]);

      const faqFallback = capturedFaqFallbacks.get("luggageStorage");
      expect(faqFallback?.("it")).toEqual([
        { q: "Quanto costa?", a: ["Dai 10€ ai 15€ a bagaglio."] },
      ]);

      const serviceProps = serviceStructuredDataMock.mock.calls.at(-1)?.[0] as {
        areaServed: string;
        serviceType: string;
        inLanguage: string;
      };
      expect(serviceProps).toMatchObject({
        areaServed: "Positano centro",
        serviceType: "Deposito bagagli locale",
        inLanguage: "it",
      });
    });
  });

  it("falls back to English service metadata and FAQ entries when locale bundles are empty", async () => {
    await withGuideMocks("luggageStorage", async ({ renderRoute, screen, setTranslations }) => {
      setTranslations("en", "guides", {
        "guides.meta.luggageStorage.title": "Luggage storage in Positano",
        "guides.meta.luggageStorage.description": "Where to stash your bags safely.",
        "content.luggageStorage.seo.title": "Luggage storage in Positano",
        "content.luggageStorage.seo.description": "Where to stash your bags safely.",
        "content.luggageStorage.intro": ["English intro"],
        "content.luggageStorage.sections": [{ id: "overview", title: "Overview", body: ["English overview"] }],
        "content.luggageStorage.faqs": [{ q: "English Q", a: ["English A"] }],
        "content.luggageStorage.faqsTitle": "English FAQs",
        "content.luggageStorage.serviceType": "Porter service",
        "content.luggageStorage.areaServed": "Amalfi Coast",
        "content.luggageStorage.heroAlt": "English hero alt",
        "labels.onThisPage": "On this page",
        "labels.faqsHeading": "FAQs",
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
        guides: {
          meta: {
            luggageStorage: {
              title: "Luggage storage in Positano",
              description: "Where to stash your bags safely.",
            },
          },
        },
        content: {
          luggageStorage: {
            seo: {
              title: "Luggage storage in Positano",
              description: "Where to stash your bags safely.",
            },
            intro: ["English intro"],
            sections: [{ id: "overview", title: "Overview", body: ["English overview"] }],
            faqs: [{ q: "English Q", a: ["English A"] }],
            faqsTitle: "English FAQs",
            serviceType: "Porter service",
            areaServed: "Amalfi Coast",
            heroAlt: "English hero alt",
          },
        },
        labels: {
          onThisPage: "On this page",
          faqsHeading: "FAQs",
          homeBreadcrumb: "Home",
          guidesBreadcrumb: "Guides",
        },
        breadcrumbs: {
          home: "Home",
          guides: "Guides",
        },
      });

      setTranslations("fr", "guides", {
        "guides.meta.luggageStorage.title": "Consignes à bagages",
        "guides.meta.luggageStorage.description": "Où laisser vos valises en sécurité.",
        "content.luggageStorage.seo.title": "Consignes à bagages",
        "content.luggageStorage.seo.description": "Où laisser vos valises en sécurité.",
        "content.luggageStorage.intro": [],
        "content.luggageStorage.toc": [],
        "content.luggageStorage.sections": [],
        "content.luggageStorage.faqs": [],
        "content.luggageStorage.faq": [],
        "content.luggageStorage.serviceType": " ",
        "content.luggageStorage.areaServed": "",
        "content.luggageStorage.heroAlt": "",
        "labels.onThisPage": "Sections",
        "labels.faqsHeading": "FAQ",
        "labels.homeBreadcrumb": "Accueil",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Accueil",
        "breadcrumbs.guides": "Guides",
        guides: {
          meta: {
            luggageStorage: {
              title: "Consignes à bagages",
              description: "Où laisser vos valises en sécurité.",
            },
          },
        },
        content: {
          luggageStorage: {
            seo: {
              title: "Consignes à bagages",
              description: "Où laisser vos valises en sécurité.",
            },
            intro: [],
            toc: [],
            sections: [],
            faqs: [],
            faq: [],
            serviceType: " ",
            areaServed: "",
            heroAlt: "",
          },
        },
        labels: {
          onThisPage: "Sections",
          faqsHeading: "FAQ",
          homeBreadcrumb: "Accueil",
          guidesBreadcrumb: "Guides",
        },
        breadcrumbs: {
          home: "Accueil",
          guides: "Guides",
        },
      });

      await renderRoute({
        lang: "fr",
        route: "/fr/guides/luggage-storage-positano",
      });

      await expect(
        screen.findByRole("heading", { level: 1, name: /consignes à bagages/i }),
      ).resolves.toBeInTheDocument();

      expect(screen.queryByRole("navigation", { name: "Sections" })).toBeNull();

      const faqFallback = capturedFaqFallbacks.get("luggageStorage");
      expect(faqFallback?.("fr")).toEqual([{ q: "English Q", a: ["English A"] }]);

      const serviceProps = serviceStructuredDataMock.mock.calls.at(-1)?.[0] as {
        areaServed: string;
        serviceType: string;
        inLanguage: string;
      };
      expect(serviceProps).toMatchObject({
        areaServed: "Amalfi Coast",
        serviceType: "Porter service",
        inLanguage: "fr",
      });
    });
  });
});