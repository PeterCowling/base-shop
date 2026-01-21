// src/app/[lang]/privacy-policy/page.tsx
// Privacy Policy page - App Router version
import { Fragment } from "react";
import type { Metadata } from "next";

import { Section } from "@acme/ui/atoms/Section";

import { getTranslations, resolveI18nMetaForApp, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { CONTACT_EMAIL } from "@/config/hotel";
import { getSlug } from "@/utils/slug";

type Props = {
  params: Promise<{ lang: string }>;
};

const NS = "privacyPolicyPage";

const SECTION_KEYS = [
  "intro",
  "controller",
  "dataWeCollect",
  "howWeUse",
  "legalBases",
  "sharing",
  "retention",
  "security",
  "yourRights",
  "international",
  "changes",
] as const;

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const meta = await resolveI18nMetaForApp(validLang, NS);
  const localizedSlug = getSlug("privacyPolicy", validLang);
  const path = `/${validLang}/${localizedSlug}`;

  return buildAppMetadata({
    lang: validLang,
    title: meta.title,
    description: meta.description,
    path,
  });
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, [NS, "translation"]);

  const sections = SECTION_KEYS.map((key) => ({
    key,
    title: t(`sections.${key}.title`) as string,
  }));

  const lastUpdatedDate = t("lastUpdated.date") as string;

  return (
    <Fragment>
      <Section padding="none" className="mx-auto max-w-5xl p-6 pt-24 sm:pt-10">
        <article id="top">
          <header className="mb-8 space-y-2 text-center">
            <h1 className="text-3xl font-bold text-brand-heading dark:text-brand-surface">
              {t("headings.pageTitle")}
            </h1>
            <p className="text-base font-medium text-brand-text/80 dark:text-brand-surface/80">
              {t("headings.subtitle")}
            </p>
            <p className="text-sm text-brand-text/70 dark:text-brand-surface/70">
              {t("lastUpdated.label")}: {lastUpdatedDate}
            </p>
          </header>

          <details className="mb-8 rounded-2xl border border-brand-outline/20 bg-brand-surface/60 p-4 shadow-sm backdrop-blur lg:hidden dark:border-brand-outline/30 dark:bg-brand-surface/40">
            <summary className="min-h-11 cursor-pointer font-semibold text-brand-heading dark:text-brand-surface">
              {t("toc.title")}
            </summary>
            <nav aria-label={t("toc.aria") as string} className="mt-3">
              <ol className="space-y-2 text-sm">
                {sections.map((section) => (
                  <li key={section.key}>
                    <a
                      className="inline-block min-h-11 min-w-11 hover:underline"
                      href={`#${section.key}`}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </details>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <aside className="hidden lg:col-span-4 lg:block xl:col-span-3">
              <nav
                aria-label={t("toc.aria") as string}
                className="sticky top-24 max-h-screen overflow-auto pr-2"
              >
                <div className="rounded-2xl border border-brand-outline/20 bg-brand-surface/60 p-4 shadow-sm backdrop-blur dark:border-brand-outline/30 dark:bg-brand-surface/40">
                  <h2 className="text-base font-semibold text-brand-heading dark:text-brand-surface">
                    {t("toc.title")}
                  </h2>
                  <ol className="mt-3 space-y-2 text-sm">
                    {sections.map((section) => (
                      <li key={section.key}>
                        <a
                          className="inline-block min-h-11 min-w-11 text-brand-text/80 hover:text-brand-heading hover:underline dark:text-brand-surface/80 dark:hover:text-brand-surface"
                          href={`#${section.key}`}
                        >
                          {section.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </nav>
            </aside>

            <div className="prose prose-neutral prose-li:leading-7 prose-p:leading-7 dark:prose-invert lg:col-span-8 xl:col-span-9">
              {SECTION_KEYS.map((key) => {
                const body = t(`sections.${key}.body`, {
                  returnObjects: true,
                  email: CONTACT_EMAIL,
                }) as unknown;
                const paragraphs = Array.isArray(body)
                  ? body
                  : typeof body === "string" && body.trim()
                    ? [body]
                    : [];
                return (
                  <section key={key}>
                    <h2 id={key} className="scroll-mt-28">
                      {t(`sections.${key}.title`)}
                    </h2>
                    {paragraphs.map((paragraph, index) => (
                      <p key={`${key}-${index}`}>{paragraph}</p>
                    ))}
                  </section>
                );
              })}

              <p className="mt-10 italic">
                <a
                  className="inline-block min-h-11 min-w-11 font-medium not-italic hover:underline"
                  href="#top"
                >
                  {t("footer.backToTop")}
                </a>
              </p>
            </div>
          </div>
        </article>
      </Section>
    </Fragment>
  );
}
