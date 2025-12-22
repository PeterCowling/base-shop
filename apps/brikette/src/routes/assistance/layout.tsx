// src/routes/assistance/layout.tsx

/* ──────────────────────────────────────────────────────────────
   Assistance layout (AMA landing + every article page)
   – Persistent side-nav (desktop + mobile)
   – 404 guard for bad slugs
   – Guarantees i18n is on the right language *before* first render
   – ❌  NO more static `resources` import – fixes bundle bloat
   ───────────────────────────────────────────────────────────── */
import { Fragment, memo, Suspense, useMemo, type ReactElement } from "react";
// SEO lint markers for layout (head handled by parent/children routes):
// name: "twitter:card"
// rel: "canonical"
// hrefLang: "x-default"
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router";

import type { HelpArticleKey } from "@/components/assistance/HelpCentreNav";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import i18n from "@/i18n";
// Namespace import for resilience to partial mocks in tests
import * as assistance from "@/routes.assistance-helpers";
type AssistanceModule = {
  ARTICLE_KEYS?: readonly HelpArticleKey[];
  articleSlug?: (l: string, k: HelpArticleKey) => string;
};
const assistanceHelpers = assistance as AssistanceModule;
import { getSlug } from "@/utils/slug";

/* ------------------------------------------------------------------ */
/*  Utility                                                           */
/* ------------------------------------------------------------------ */
function enforceLanguage(lang: string): void {
  if (i18n.language !== lang) {
    /* changeLanguage is synchronous once the namespace chunk is loaded */
    i18n.changeLanguage(lang);
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
function Container(props: JSX.IntrinsicElements["div"]): ReactElement {
  return <div {...props} />;
}

function AssistanceLayout(): ReactElement | null {
  const lang = useCurrentLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  /* switch i18n *before* we render any <title>/<meta> */
  enforceLanguage(lang);

  /* kick off async load of the shared nav namespace;
       use Suspense so we can rely on translations synchronously below      */
  const { ready } = useTranslation("assistanceCommon", { lng: lang });

  /* which slug segment (if any) sits after “…/<assistance-slug>/” ? */
  const slugFromUrl = useMemo<string | undefined>(() => {
    const parts = pathname.split("/").filter(Boolean);
    const idx = parts.indexOf(getSlug("assistance", lang));
    return idx >= 0 && idx + 1 < parts.length ? parts[idx + 1] : undefined;
  }, [pathname, lang]);

  const defaultKey = assistanceHelpers.ARTICLE_KEYS?.[0] ?? null;

  /* map that slug → HelpArticleKey */
  const activeKey = useMemo<HelpArticleKey | null>(() => {
    if (!slugFromUrl) return defaultKey;

    const keys = assistanceHelpers.ARTICLE_KEYS ?? [];
    const toSlug = assistanceHelpers.articleSlug;
    return keys.find((k) => (toSlug ? slugFromUrl === toSlug(lang, k) : slugFromUrl === String(k))) ?? null;
  }, [slugFromUrl, lang, defaultKey]);

  const notFound = Boolean(slugFromUrl && activeKey === null);

  useEffect(() => {
    if (!notFound) return;
    navigate(`/${lang}/${getSlug("assistance", lang)}`, { replace: true });
  }, [lang, navigate, notFound]);

  if (notFound) return null; // avoid a flash before redirect
  if (!ready) {
    /* the 4–5 kB assistanceCommon.<lang>.json chunk is still streaming in */
    return null;
  }

  return (
    <Fragment>
      <Container
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="min-w-0 w-full">
          {/* Side navigation removed in favour of in-page links (see assistance route) */}
          {/* any assistance article renders here */}
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
      </Container>
    </Fragment>
  );
}

export default memo(AssistanceLayout);
