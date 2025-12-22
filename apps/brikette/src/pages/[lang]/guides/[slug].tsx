import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";

import { listLocalizedPaths } from "@/compat/route-runtime";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";
import { guideNamespace } from "@/guides/slugs/namespaces";
import { GUIDE_SLUG_LOOKUP_BY_LANG } from "@/guides/slugs/lookups";
import { guideSlug } from "@/guides/slugs/urls";
import { isSupportedLanguage } from "@/config";
import { Section } from "@acme/ui/atoms/Section";

type PageProps = {
  lang: AppLanguage;
  slug: string;
  destination: string;
};

const normalize = (value: string): string => {
  if (value.length > 1 && value.endsWith("/")) return value.slice(0, -1);
  return value;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const supported = (i18nConfig.supportedLngs ?? []) as string[];
  const paths = listLocalizedPaths()
    .map(normalize)
    .filter((path) => {
      const parts = path.replace(/^\/+/, "").split("/").filter(Boolean);
      if (parts.length !== 3) return false;
      const [lang, section] = parts;
      if (!lang || !section || !supported.includes(lang)) return false;
      return section === getSlug("guides", lang as AppLanguage);
    })
    .map((path) => {
      const parts = path.replace(/^\/+/, "").split("/").filter(Boolean);
      const lang = parts[0] ?? "";
      const slug = parts[2] ?? "";
      return {
        params: {
          lang,
          slug,
        },
      };
    });

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const langParam = (params?.["lang"] as string | undefined) ?? "";
  const slug = (params?.["slug"] as string | undefined) ?? "";
  const fallbackLang = i18nConfig.fallbackLng as AppLanguage;
  const lang = isSupportedLanguage(langParam) ? (langParam as AppLanguage) : fallbackLang;

  if (!slug) {
    return { notFound: true };
  }

  const lookup = GUIDE_SLUG_LOOKUP_BY_LANG[lang];
  const key = lookup?.[slug];
  if (!key) {
    return { notFound: true };
  }

  const base = guideNamespace(lang, key);
  const destination = `/${lang}/${base.baseSlug}/${guideSlug(lang, key)}`;

  return {
    props: {
      lang,
      slug,
      destination,
    },
  };
};

export default function LegacyGuidePage({ destination, lang }: PageProps): JSX.Element {
  const router = useRouter();
  const { t } = useTranslation("guides", { lng: lang });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { search, hash } = window.location;
    const target = `${destination}${search}${hash}`;
    const current = `${window.location.pathname}${search}${hash}`;
    if (current !== target) {
      void router.replace(target);
    }
  }, [destination, router]);

  return (
    <>
      <Head>
        <meta httpEquiv="refresh" content={`0; url=${destination}`} />
        <link rel="canonical" href={destination} />
      </Head>
      <Section
        as="main"
        padding="none"
        width="full"
        className="mx-auto mt-24 max-w-md px-6 text-center"
      >
        <h1 className="text-2xl font-semibold">{t("redirectPage.title")}</h1>
        <p className="mt-3 text-sm text-brand-text/70">
          <Trans
            i18nKey={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] i18n key */ "redirectPage.message"}
            t={t}
            components={{
              link: (
                <a
                  className="inline-flex min-h-11 min-w-11 items-center justify-center underline"
                  href={destination}
                />
              ),
            }}
          />
        </p>
      </Section>
    </>
  );
}
