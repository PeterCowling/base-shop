// src/app/[lang]/terms/page.tsx
// Terms and Conditions page - App Router version
import { Fragment } from "react";
import type { Metadata } from "next";

import { Section } from "@acme/ui/atoms/Section";

import { getTranslations, resolveI18nMetaForApp, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { getSlug } from "@/utils/slug";
import { slugify } from "@/utils/slugify";

type Props = {
  params: Promise<{ lang: string }>;
};

const SECTION_KEYS: readonly string[] = Array.from({ length: 17 }, (_, i) => `s${i + 1}`);

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const meta = await resolveI18nMetaForApp(validLang, "termsPage");
  // Use localized slug in the canonical URL
  const localizedSlug = getSlug("terms", validLang);
  const path = `/${validLang}/${localizedSlug}`;

  return buildAppMetadata({
    lang: validLang,
    title: meta.title,
    description: meta.description,
    path,
  });
}

export default async function TermsPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["termsPage", "translation"]);

  const sections = SECTION_KEYS.map((key) => {
    const label = t(`sections.${key}.title`) as string;
    const id = `${key}-${slugify(label)}`;
    return { key, label, id } as const;
  });

  return (
    <Fragment>
      <Section
        padding="none"
        className="mx-auto w-full max-w-6xl px-4 pb-10 pt-24 sm:px-6 sm:pt-10 md:px-8 lg:px-10"
      >
        <section id="top">
          <header className="mb-6 space-y-2 text-center">
            <h1 className="text-3xl font-bold">{t("headings.pageTitle")}</h1>
            <p className="text-lg font-medium">{t("headings.pageSubtitle")}</p>
          </header>

          {/* Mobile TOC */}
          <details className="mb-4 rounded-lg border border-neutral-200 bg-brand-bg/60 backdrop-blur lg:hidden dark:border-neutral-800 dark:bg-neutral-900/60">
            <summary className="min-h-10 cursor-pointer px-4 py-3 font-semibold">
              {t("toc.title")}
            </summary>
            <nav aria-label={t("toc.aria") as string} className="px-4 pb-4">
              <ol className="space-y-2 text-sm">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      className="inline-block min-h-11 min-w-11 hover:underline"
                      href={`#${s.id}`}
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </details>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Desktop TOC */}
            <aside className="hidden lg:col-span-4 lg:block xl:col-span-3">
              <nav
                aria-label={t("toc.aria") as string}
                className="sticky top-24 max-h-screen overflow-auto pr-2"
              >
                <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                  <h2 className="mb-3 text-base font-semibold">{t("toc.title")}</h2>
                  <ol className="space-y-2 text-sm">
                    {sections.map((s) => (
                      <li key={s.id}>
                        <a
                          className="inline-block min-h-11 min-w-11 text-neutral-700 hover:text-neutral-900 hover:underline dark:text-neutral-300 dark:hover:text-brand-heading"
                          href={`#${s.id}`}
                        >
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </nav>
            </aside>

            <article className="lg:col-span-8 xl:col-span-9">
              {sections.map((s) => (
                <section key={s.id} className="mt-14 space-y-4 first:mt-0">
                  <h2 id={s.id} className="scroll-mt-28 text-2xl font-bold leading-tight">
                    {t(`sections.${s.key}.title`)}
                  </h2>
                  {(t(`sections.${s.key}.body`, { returnObjects: true }) as string[]).map(
                    (p, i) => (
                      <p
                        key={`${s.key}-${i}`}
                        className="text-base leading-7 text-neutral-900 sm:text-lg sm:leading-8 dark:text-neutral-100"
                      >
                        {p}
                      </p>
                    )
                  )}
                </section>
              ))}
              <p className="mt-10 italic">
                {t("footer.end")}{" "}
                <a
                  className="inline-block min-h-11 min-w-11 font-medium not-italic hover:underline"
                  href="#top"
                >
                  {t("footer.backToTop")}
                </a>
              </p>
            </article>
          </div>
        </section>
      </Section>
    </Fragment>
  );
}
