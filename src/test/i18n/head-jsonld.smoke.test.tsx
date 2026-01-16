// src/test/i18n/head-jsonld.smoke.test.tsx
import { describe, it, expect } from "vitest";
import { waitFor } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { renderInLang } from "@tests/renderers";
import { expectRouteHeadBasics } from "@tests/head";
import { expectJsonLd } from "@tests/jsonld";
import { i18nConfig } from "@/i18n.config";

import Home from "@/routes/home";
import AssistanceRoute from "@/routes/assistance";

const LOCALES: string[] = ["en", "it", "fr"].filter((l) =>
  (i18nConfig.supportedLngs as ReadonlyArray<string>).includes(l)
);

async function loadData<TData>(
  loader: ((args: LoaderFunctionArgs) => Promise<TData> | TData) | undefined,
  path: string,
  lang: string,
): Promise<TData | { lang: string }> {
  if (typeof loader !== "function") {
    return { lang };
  }
  const request = new Request(`https://example.test${path}`);
  const params = { lang };
  return loader({ request, params, context: {} } as LoaderFunctionArgs);
}

describe("i18n smoke – head + JSON-LD across locales", () => {
  for (const lang of LOCALES) {
    it(`home: head basics + Hotel JSON-LD (${lang})`, async () => {
      const path = `/${lang}`;
      const data = await loadData(HomeRoute.clientLoader, path, lang);
      renderRoute(
        {
          default: HomeRoute.default,
          meta: HomeRoute.meta,
          links: HomeRoute.links,
        },
        {
          route: path,
          loaderData: data,
        },
      );
      await waitFor(() => expectRouteHeadBasics());
      expect(
        document.querySelector('meta[property="og:locale"]')?.getAttribute("content")
      ).toBe(lang);

      await waitFor(() =>
        expectJsonLd("Hostel", (node) => {
          expect(node.inLanguage).toBe(lang);
        }),
      );
    });

    it(`assistance index: head basics + Service JSON-LD (${lang})`, async () => {
      const path = `/${lang}/help`;
      const data = await loadData(AssistanceRoute.clientLoader, path, lang);
      renderRoute(
        {
          default: AssistanceRoute.default,
          meta: AssistanceRoute.meta,
          links: AssistanceRoute.links,
        },
        {
          route: path,
          loaderData: data,
        },
      );
      await waitFor(() => expectRouteHeadBasics());
      expect(
        document.querySelector('meta[property="og:locale"]')?.getAttribute("content")
      ).toBe(lang);

      await waitFor(() =>
        expectJsonLd("Service", (node) => {
          expect(node.inLanguage).toBe(lang);
        }),
      );
    });
  }
});