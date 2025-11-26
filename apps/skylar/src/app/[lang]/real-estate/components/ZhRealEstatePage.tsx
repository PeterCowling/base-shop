import Link from "next/link";
import PageShell from "@/components/PageShell";
import type { Locale } from "@/lib/locales";
import type { TranslateFn } from "../utils";

type ZhRealEstatePageProps = {
  lang: Locale;
  translator: TranslateFn;
};

const splitParagraphs = (value: string) =>
  value
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const splitList = (value: string) =>
  value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

export default function ZhRealEstatePage({ lang, translator }: ZhRealEstatePageProps) {
  const hero = {
    eyebrow: translator("realEstate.zh.hero.eyebrow"),
    title: translator("realEstate.zh.hero.title"),
    body: splitParagraphs(translator("realEstate.zh.hero.body")),
    subbody: translator("realEstate.zh.hero.subbody"),
    chips: splitList(translator("realEstate.zh.hero.chips")),
  };

  const regions = {
    heading: translator("realEstate.zh.regions.heading"),
    body: splitParagraphs(translator("realEstate.zh.regions.body")),
  };

  const tourism = {
    heading: translator("realEstate.zh.tourism.heading"),
    intro: translator("realEstate.zh.tourism.intro"),
    body: splitParagraphs(translator("realEstate.zh.tourism.body")),
  };

  const context = {
    heading: translator("realEstate.zh.context.heading"),
    body: splitParagraphs(translator("realEstate.zh.context.body")),
    list: splitList(translator("realEstate.zh.context.list")),
    footer: translator("realEstate.zh.context.footer"),
  };

  const caseStudies = [
    {
      title: translator("realEstate.zh.caseStudies.hostel.title"),
      tagline: translator("realEstate.zh.caseStudies.hostel.tagline"),
      body: translator("realEstate.zh.caseStudies.hostel.body"),
      bullets: splitList(translator("realEstate.zh.caseStudies.hostel.bullets")),
    },
    {
      title: translator("realEstate.zh.caseStudies.stepfree.title"),
      tagline: translator("realEstate.zh.caseStudies.stepfree.tagline"),
      body: translator("realEstate.zh.caseStudies.stepfree.body"),
      bullets: splitList(translator("realEstate.zh.caseStudies.stepfree.bullets")),
    },
    {
      title: translator("realEstate.zh.caseStudies.tower.title"),
      tagline: translator("realEstate.zh.caseStudies.tower.tagline"),
      body: translator("realEstate.zh.caseStudies.tower.body"),
      bullets: splitList(translator("realEstate.zh.caseStudies.tower.bullets")),
    },
  ];

  const details = [
    {
      heading: translator("realEstate.zh.details.location.heading"),
      body: translator("realEstate.zh.details.location.body"),
    },
    {
      heading: translator("realEstate.zh.details.guests.heading"),
      body: translator("realEstate.zh.details.guests.body"),
    },
    {
      heading: translator("realEstate.zh.details.experience.heading"),
      body: translator("realEstate.zh.details.experience.body"),
    },
  ];

  const cta = {
    href: translator("links.hostel"),
    label: translator("realEstate.zh.cta.label"),
    note: translator("realEstate.zh.cta.note"),
  };

  return (
    <PageShell lang={lang} active="realEstate">
      <div className="zh-realestate-stack">
        <section className="zh-products-hero zh-realestate-hero">
          <div className="zh-products-hero__copy">
            <p className="zh-products-hero__eyebrow">{hero.eyebrow}</p>
            <h1 className="zh-products-hero__title">{hero.title}</h1>
            <div className="zh-realestate-body">
              {hero.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {hero.subbody && (
              <div className="zh-realestate-body">
                <p>{hero.subbody}</p>
              </div>
            )}
            {hero.chips.length > 0 && (
              <ul className="zh-realestate-chips">
                {hero.chips.map((chip) => (
                  <li key={chip}>{chip}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="zh-card">
          <p className="zh-realestate-heading">{regions.heading}</p>
          <div className="zh-realestate-body">
            {regions.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="zh-card">
          <p className="zh-realestate-heading">{tourism.heading}</p>
          <div className="zh-realestate-body">
            <p>{tourism.intro}</p>
          </div>
          <div className="zh-realestate-body">
            {tourism.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="zh-card">
          <p className="zh-realestate-heading">{context.heading}</p>
          <div className="zh-realestate-body">
            {context.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className="zh-realestate-list">
            {context.list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="zh-realestate-body">
            <p>{context.footer}</p>
          </div>
        </section>

        <section className="zh-card zh-realestate-cases">
          <p className="zh-realestate-heading">{translator("realEstate.zh.caseStudies.heading")}</p>
          <div className="zh-realestate-cases__grid">
            {caseStudies.map((study) => (
              <article key={study.title} className="zh-realestate-case">
                <p className="zh-realestate-case__title">{study.title}</p>
                <p className="zh-realestate-case__tag">{study.tagline}</p>
                <div className="zh-realestate-body">
                  <p>{study.body}</p>
                </div>
                <ul className="zh-realestate-list">
                  {study.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="zh-card zh-realestate-details">
          <p className="zh-realestate-heading">{translator("realEstate.zh.details.heading")}</p>
          <div className="zh-realestate-details__grid">
            {details.map((detail) => (
              <article key={detail.heading} className="zh-realestate-detail">
                <p className="zh-realestate-detail__title">{detail.heading}</p>
                <div className="zh-realestate-body">
                  <p>{detail.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="zh-card zh-realestate-cta">
          <p className="zh-realestate-heading">{translator("realEstate.zh.caseStudies.hostel.title")}</p>
          <div className="zh-realestate-body">
            <p>{cta.note}</p>
          </div>
          <Link href={cta.href} target="_blank" rel="noreferrer" className="zh-card__cta">
            {cta.label}
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
