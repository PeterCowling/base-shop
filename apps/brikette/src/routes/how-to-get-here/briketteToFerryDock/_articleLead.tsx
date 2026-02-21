import { type ReactNode } from "react";
import Link from "next/link";
import type { TFunction } from "i18next";

import TableOfContents from "@/components/guides/TableOfContents";
import i18n from "@/i18n";
import { guideHref } from "@/routes.guides-helpers";
import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";

import { ZoomableFigure } from "../components/ZoomableFigure";
import { INLINE_LINK_CLASSES, renderInlineLinks } from "../renderInlineLinks";

import { createGuideLabelReader } from "./labels";
import type { GuideExtras } from "./types";

const FIGURE_PATTERN = /^\s*\[\[figure:([a-z0-9-]+)\]\]\s*$/i;

// Namespace for route-specific translations
const ROUTE_NAMESPACE = "briketteToFerryDock" as const;

// Image paths (static, not user-facing copy)
const FIGURE_PATHS = {
  map: {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-01.jpg",
    aspect: "16/9",
  },
  "point-1": {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-02.jpg",
    aspect: "16/9",
  },
  tabacchi: {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-03.png",
    aspect: "16/9",
  },
  "point-2": {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-04.jpg",
    aspect: "16/9",
  },
  "point-3": {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-05.jpg",
    aspect: "4/3",
  },
  "point-4": {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-06.jpg",
    aspect: "16/9",
  },
  "point-5": {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-07.jpg",
    aspect: "2/3",
  },
  tickets: {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-08.jpg",
    aspect: "16/9",
  },
  port: {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-09.jpg",
    aspect: "16/9",
  },
} as const;

function buildFigures(tRoute: TFunction<typeof ROUTE_NAMESPACE>) {
  return {
    map: {
      ...FIGURE_PATHS.map,
      alt: tRoute("figures.map.alt"),
      caption: tRoute("figures.map.caption"),
    },
    "point-1": {
      ...FIGURE_PATHS["point-1"],
      alt: tRoute("figures.point1.alt"),
      caption: tRoute("figures.point1.caption"),
    },
    tabacchi: {
      ...FIGURE_PATHS.tabacchi,
      alt: tRoute("figures.tabacchi.alt"),
      caption: tRoute("figures.tabacchi.caption"),
    },
    "point-2": {
      ...FIGURE_PATHS["point-2"],
      alt: tRoute("figures.point2.alt"),
      caption: tRoute("figures.point2.caption"),
    },
    "point-3": {
      ...FIGURE_PATHS["point-3"],
      alt: tRoute("figures.point3.alt"),
      caption: tRoute("figures.point3.caption"),
    },
    "point-4": {
      ...FIGURE_PATHS["point-4"],
      alt: tRoute("figures.point4.alt"),
      caption: tRoute("figures.point4.caption"),
    },
    "point-5": {
      ...FIGURE_PATHS["point-5"],
      alt: tRoute("figures.point5.alt"),
      caption: tRoute("figures.point5.caption"),
    },
    tickets: {
      ...FIGURE_PATHS.tickets,
      alt: tRoute("figures.tickets.alt"),
      caption: tRoute("figures.tickets.caption"),
    },
    port: {
      ...FIGURE_PATHS.port,
      alt: tRoute("figures.port.alt"),
      caption: tRoute("figures.port.caption"),
    },
  } as const;
}

export function renderArticleLead(
  context: GuideSeoTemplateContext,
  extras: GuideExtras,
): JSX.Element {
  const {
    intro,
    sections,
    tocItems,
    tocTitle,
    beforeList,
    stepsList,
    kneesList,
    kneesDockPrefix,
    kneesDockLinkText,
    kneesPorterPrefix,
    kneesPorterLinkText,
    faqs,
    faqsTitle,
    labels,
  } = extras;

  const readLabel = createGuideLabelReader(context, labels);
  const tHowTo = i18n.getFixedT(context.lang, "howToGetHere");
  const tRoute = i18n.getFixedT(context.lang, ROUTE_NAMESPACE) as TFunction<typeof ROUTE_NAMESPACE>;
  const FIGURES = buildFigures(tRoute);

  const renderBodyLine = (value: string, keyPrefix: string): ReactNode => {
    const match = value.match(FIGURE_PATTERN);
    if (!match) {
      return (
        <p key={keyPrefix} className="leading-relaxed">
          {renderInlineLinks(value, keyPrefix, context)}
        </p>
      );
    }

    const id = match[1]?.toLowerCase() as keyof typeof FIGURES | undefined;
    const figure = id ? FIGURES[id] : undefined;
    if (!figure) {
      return (
        <p key={keyPrefix} className="leading-relaxed">
          {renderInlineLinks(value, keyPrefix, context)}
        </p>
      );
    }

    return (
      <ZoomableFigure
        key={keyPrefix}
        t={tHowTo}
        src={figure.src}
        alt={figure.alt}
        caption={figure.caption}
        aspect={figure.aspect}
        // eslint-disable-next-line ds/container-widths-only-at -- LINT-1009 [ttl=2026-12-31] figure inside article; not a page-level container
        className="max-w-3xl"
      />
    );
  };

  const shouldRenderKnees =
    kneesList.length > 0 ||
    (kneesDockPrefix && kneesDockLinkText) ||
    (kneesPorterPrefix && kneesPorterLinkText);

  return (
    <div className="space-y-12">
      {intro.length > 0 ? (
        <div className="space-y-4">
          {intro.map((paragraph, index) => (
            <p key={`intro-${index}`} className="leading-relaxed">
              {renderInlineLinks(paragraph, `intro-${index}`, context)}
            </p>
          ))}
        </div>
      ) : null}

      {tocItems.length > 0 ? (
        <TableOfContents className="mt-6" title={tocTitle} items={tocItems} />
      ) : null}

      {sections.map((section) => (
        <section key={section.id} id={section.id} className="space-y-5">
          <h2 className="text-pretty text-3xl font-semibold tracking-tight">{section.title}</h2>
          <div className="space-y-4">
            {section.body.map((line, index) =>
              renderBodyLine(line, `${section.id}-body-${index}`),
            )}
          </div>
        </section>
      ))}

      {beforeList.length > 0 ? (
        <section id="before" className="space-y-4">
          <h2 className="text-pretty text-3xl font-semibold tracking-tight">
            {readLabel("toc.before") ?? labels.before}
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {beforeList.map((item, index) => (
              <li key={`before-${index}`} className="leading-relaxed">
                {renderInlineLinks(item, `before-${index}`, context)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stepsList.length > 0 ? (
        <section id="steps" className="space-y-4">
          <h2 className="text-pretty text-3xl font-semibold tracking-tight">
            {readLabel("toc.steps") ?? labels.steps}
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            {stepsList.map((item, index) => (
              <li key={`steps-${index}`} className="leading-relaxed">
                {renderInlineLinks(item, `steps-${index}`, context)}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {shouldRenderKnees ? (
        <section id="knees" className="space-y-4">
          <h2 className="text-pretty text-3xl font-semibold tracking-tight">
            {readLabel("toc.knees") ?? labels.knees}
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {kneesList.map((item, index) => (
              <li key={`knees-${index}`} className="leading-relaxed">
                {renderInlineLinks(item, `knees-${index}`, context)}
              </li>
            ))}
            {kneesDockPrefix && kneesDockLinkText ? (
              <li className="leading-relaxed">
                {kneesDockPrefix}{" "}
                <Link
                  href={guideHref(context.lang, "chiesaNuovaArrivals")}
                  className={INLINE_LINK_CLASSES}
                >
                  {kneesDockLinkText}
                </Link>
                .
              </li>
            ) : null}
            {kneesPorterPrefix && kneesPorterLinkText ? (
              <li className="leading-relaxed">
                {kneesPorterPrefix}{" "}
                <Link
                  href={guideHref(context.lang, "porterServices")}
                  className={INLINE_LINK_CLASSES}
                >
                  {kneesPorterLinkText}
                </Link>
                .
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {faqs.length > 0 ? (
        <section id="faqs" className="space-y-4">
          <h2 className="text-pretty text-3xl font-semibold tracking-tight">{faqsTitle}</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <details
                key={faq.q}
                className="rounded-lg border border-brand-outline/20 bg-brand-surface/80 p-4 shadow-sm transition hover:border-brand-primary/40 dark:border-brand-outline/40 dark:bg-brand-surface/30"
              >
                <summary className="cursor-pointer text-base font-semibold text-brand-heading outline-none transition focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2 dark:text-brand-text">
                  {faq.q}
                </summary>
                <div className="mt-3 space-y-3">
                  {faq.a.map((answer, answerIndex) => (
                    <p key={`faq-${index}-${answerIndex}`} className="leading-relaxed">
                      {renderInlineLinks(answer, `faq-${index}-${answerIndex}`, context)}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
