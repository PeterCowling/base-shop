// src/app/[lang]/about/page.tsx
// About page - App Router version
import { Fragment } from "react";
import type { Metadata } from "next";

import { Section } from "@acme/design-system/atoms";

import { getTranslations, resolveI18nMetaForApp, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { CfImage } from "@acme/ui/atoms/CfImage";
import AboutStructuredData from "@/components/seo/AboutStructuredData";
import { getSlug } from "@/utils/slug";

type Props = {
  params: Promise<{ lang: string }>;
};

const HERO_IMAGE_PATH = "/img/facade.avif" as const;

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const meta = await resolveI18nMetaForApp(validLang, "aboutPage");
  const localizedSlug = getSlug("about", validLang);
  const path = `/${validLang}/${localizedSlug}`;

  return buildAppMetadata({
    lang: validLang,
    title: meta.title,
    description: meta.description,
    path,
  });
}

export default async function AboutPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["aboutPage", "translation"]);

  const missionHeadingKey = "mission.heading" as const;
  const missionHeadingRaw = t(missionHeadingKey) as string;
  const missionHeading =
    missionHeadingRaw && missionHeadingRaw !== missionHeadingKey ? missionHeadingRaw : "";
  const missionParagraphsRaw = t("mission.paragraphs", { returnObjects: true }) as unknown;
  const missionParagraphs = Array.isArray(missionParagraphsRaw)
    ? (missionParagraphsRaw as string[]).filter(
        (p) => typeof p === "string" && p.trim().length > 0
      )
    : [];
  const hasMissionCopy = missionHeading.trim().length > 0 && missionParagraphs.length > 0;

  const intro1Key = "paragraph1" as const;
  const intro2Key = "paragraph2" as const;
  const introLeadRaw = t(intro1Key) as string;
  const introLead = introLeadRaw && introLeadRaw !== intro1Key ? introLeadRaw : "";
  const para2Raw = t(intro2Key) as string;
  const supportingParagraphs = [para2Raw && para2Raw !== intro2Key ? para2Raw : ""].filter(
    (p) => p.trim().length > 0
  );

  return (
    <Fragment>
      <AboutStructuredData />

      <Section
        as="main"
        padding="none"
        width="full"
        className="scroll-mt-24 px-6 pb-16 pt-24 sm:pt-10"
      >
        <Section
          as="div"
          width="full"
          padding="none"
          className="mx-auto w-full max-w-4xl space-y-12"
        >
          <Section
            width="full"
            padding="none"
            className="relative isolate overflow-hidden rounded-3xl bg-brand-primary/90 text-brand-surface shadow-xl"
          >
            <div className="absolute inset-0">
              <CfImage
                src={HERO_IMAGE_PATH}
                preset="hero"
                alt={t("meta.ogImageAlt") as string}
                className="size-full object-cover opacity-60"
                width={1600}
                height={900}
                data-aspect="16/9"
              />
            </div>
            <div className="relative flex flex-col gap-5 px-6 py-16 text-start sm:px-10 sm:py-20">
              <h1 className="text-3xl font-bold leading-tight text-brand-surface sm:text-4xl">
                {t("heading")}
              </h1>
              {introLead.trim().length ? (
                <Section as="div" width="full" padding="none" className="max-w-2xl">
                  <p className="text-lg text-brand-surface/85">{introLead}</p>
                </Section>
              ) : null}
            </div>
          </Section>

          {supportingParagraphs.length ? (
            <Section
              padding="none"
              width="full"
              className="space-y-4 text-center text-lg text-brand-text/90 dark:text-brand-surface/90"
            >
              {supportingParagraphs.map((paragraph, index) => (
                <p key={`about-intro-${index}`}>{paragraph}</p>
              ))}
            </Section>
          ) : null}

          {hasMissionCopy ? (
            <Section
              padding="none"
              width="full"
              className="rounded-3xl border border-brand-outline/40 bg-brand-primary/5 p-8 text-start shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/10"
            >
              <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-surface">
                {missionHeading}
              </h2>
              <div className="mt-4 space-y-4 text-brand-text/80 dark:text-brand-surface/80">
                {missionParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </Section>
          ) : null}
        </Section>
      </Section>
    </Fragment>
  );
}
