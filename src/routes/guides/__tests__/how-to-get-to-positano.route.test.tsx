import { describe, expect, it, vi } from "vitest";
import React from "react";

import { withGuideMocks } from "./guideTestHarness";
import { resetGuideTemplateSpy, getGuideTemplateProps } from "@tests/guides/template-spy";
import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";
import { getGuidesTranslator } from "../how-to-get-to-positano.translators";
import type { GuideExtras, GuideFaq } from "../how-to-get-to-positano.types";
import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import { setCurrentLanguage } from "./guides.test-utils";

describe("HowToGetToPositano route", () => {
  it("wires the guide template callbacks to the route helpers", async () => {
    await withGuideMocks("howToGetToPositano", async ({ renderRoute }) => {
      resetGuideTemplateSpy();

      const [
        articleLeadModule,
        additionalScriptsModule,
        extrasModule,
        breadcrumbModule,
        faqModule,
      ] = await Promise.all([
        import("../how-to-get-to-positano.article-lead"),
        import("../how-to-get-to-positano.additional-scripts"),
        import("../how-to-get-to-positano.extras"),
        import("../how-to-get-to-positano.breadcrumb"),
        import("../how-to-get-to-positano.faq"),
      ]);

      let extrasBuilderArg: unknown;

      const renderArticleLeadSpy = vi
        .spyOn(articleLeadModule, "renderArticleLead")
        .mockImplementation((context: GuideSeoTemplateContext, extrasBuilder) => {
          extrasBuilderArg = extrasBuilder;
          return (
            <article data-testid="article-lead" data-lang={context.lang}>
              Guide lead
            </article>
          );
        });

      const renderAdditionalScriptsSpy = vi
        .spyOn(additionalScriptsModule, "renderAdditionalScripts")
        .mockImplementation((context?: GuideSeoTemplateContext) => (
          <div data-testid="additional-scripts" data-lang={context?.lang} />
        ));

      const minimalExtras: GuideExtras = {
        hasStructured: true,
        intro: [],
        sections: [],
        toc: [],
        when: { heading: "", items: [] },
        cheapest: { heading: "", steps: [] },
        seasonal: { heading: "", points: [] },
      };
      const buildGuideExtrasSpy = vi.spyOn(extrasModule, "buildGuideExtras").mockReturnValue(minimalExtras);

      const breadcrumb: BreadcrumbList = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [],
      };
      const buildBreadcrumbSpy = vi.spyOn(breadcrumbModule, "buildBreadcrumb").mockReturnValue(breadcrumb);

      const buildGuideFaqFallbackSpy = vi
        .spyOn(faqModule, "buildGuideFaqFallback")
        .mockImplementation((lang: string): GuideFaq[] => [{ q: `faq:${lang}`, a: [] }]);

      try {
        const placeholder = document.createElement("article");
        placeholder.setAttribute("role", "article");
        placeholder.setAttribute("data-testid", "harness-placeholder");
        document.body.appendChild(placeholder);

        await renderRoute({ lang: "en" });
        placeholder.remove();

        const props = getGuideTemplateProps<{
          articleLead: (ctx: GuideSeoTemplateContext) => React.ReactNode;
          additionalScripts: (ctx: GuideSeoTemplateContext) => React.ReactNode;
          buildTocItems: (ctx: GuideSeoTemplateContext) => unknown[];
          buildBreadcrumb: (ctx: GuideSeoTemplateContext) => unknown;
          guideFaqFallback: (lang: string) => unknown;
          renderGenericContent: boolean;
          guideKey: string;
          alsoHelpful: { includeRooms?: boolean };
          relatedGuides: { items: unknown };
        }>();

        expect(props).toBeDefined();
        setCurrentLanguage("en");
        const translateGuides = getGuidesTranslator("en") as GuideSeoTemplateContext["translateGuides"];
        const context: GuideSeoTemplateContext = {
          lang: "en",
          guideKey: "howToGetToPositano",
          metaKey: "howToGetToPositano",
          hasLocalizedContent: true,
          translator: translateGuides as GuideSeoTemplateContext["translator"],
          translateGuides,
          sections: [],
          intro: [],
          faqs: [],
          toc: [],
          ogImage: { url: "", width: 0, height: 0 },
          article: { title: "", description: "" },
          canonicalUrl: "https://example.test/en/guides/how-to-get-to-positano",
        };

        const articleNode = props!.articleLead(context) as React.ReactElement | null;
        expect(extrasBuilderArg).toBe(extrasModule.buildGuideExtras);
        expect(articleNode?.props["data-testid"]).toBe("article-lead");
        expect(articleNode?.props["data-lang"]).toBe("en");

        const scriptsNode = props!.additionalScripts(context) as React.ReactElement | null;
        expect(scriptsNode?.props["data-testid"]).toBe("additional-scripts");
        expect(scriptsNode?.props["data-lang"]).toBe("en");

        expect(props!.buildTocItems(context)).toEqual([]);
        expect(props!.buildBreadcrumb(context)).toBe(breadcrumb);
        expect(props!.guideFaqFallback("en")).toEqual([{ q: "faq:en", a: [] }]);
        expect(props!.additionalScripts).not.toBe(props!.articleLead);
        expect(props!.renderGenericContent).toBe(false);
        expect(props!.guideKey).toBe("howToGetToPositano");
        expect(props!.relatedGuides.items).toBeDefined();
        expect(props!.alsoHelpful.includeRooms).toBe(true);

        expect(renderArticleLeadSpy).toHaveBeenCalled();
        expect(renderAdditionalScriptsSpy).toHaveBeenCalled();
        expect(buildBreadcrumbSpy).toHaveBeenCalled();
        expect(buildGuideFaqFallbackSpy).toHaveBeenCalled();
      } finally {
        renderArticleLeadSpy.mockRestore();
        renderAdditionalScriptsSpy.mockRestore();
        buildGuideExtrasSpy.mockRestore();
        buildBreadcrumbSpy.mockRestore();
        buildGuideFaqFallbackSpy.mockRestore();
      }
    });
  });
});