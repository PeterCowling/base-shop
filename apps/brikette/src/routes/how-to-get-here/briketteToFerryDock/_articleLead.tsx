import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";

import TableOfContents from "@/components/guides/TableOfContents";
import i18n from "@/i18n";
import { guideHref, type GuideKey } from "@/routes.guides-helpers";
import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";

import { ZoomableFigure } from "../components/ZoomableFigure";
import { createGuideLabelReader } from "./labels";
import type { GuideExtras } from "./types";

const inlineLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

const GUIDE_SCHEME_PREFIX = "guide:" as const;
const FIGURE_PATTERN = /^\s*\[\[figure:([a-z0-9-]+)\]\]\s*$/i;

const FIGURES = {
  map: {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-01.jpg",
    alt: "Map showing the walking route from Hostel Brikette to Positano port with points 1–5.",
    caption: "Route overview: Hostel → Port (points 1–5).",
    aspect: "16/9",
  },
  "point-1": {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-02.jpg",
    alt: "Intersection near Viale Pasitea with a marked route and a label: “1 Turn Right”.",
    caption: "Point 1: turn right.",
    aspect: "16/9",
  },
  tabacchi: {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-03.png",
    alt: "Tabacchi storefront with an ATM next to it.",
    caption: "Tabacchi near point 1 (good landmark).",
    aspect: "16/9",
  },
  "point-2": {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-04.jpg",
    alt: "Road switchback with a marked line toward stairs and a label: “2 Take the stairs straight ahead”.",
    caption: "Point 2: leave the road and take the stairs straight ahead.",
    aspect: "16/9",
  },
  "point-3": {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-05.jpg",
    alt: "Narrow alley with steps and a marked path, labelled “3 Take the stairs straight ahead”.",
    caption: "Point 3: continue straight down the stairs.",
    aspect: "4/3",
  },
  "point-4": {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-06.jpg",
    alt: "Crosswalk and road with a marked route toward stairs on the right, labelled “4”.",
    caption: "Point 4: cross the road, turn left briefly, then take the stairs down on the right.",
    aspect: "16/9",
  },
  "point-5": {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-07.jpg",
    alt: "Small square near the port with a marked route, labelled “5”.",
    caption: "Point 5: continue under the archway toward the port.",
    aspect: "2/3",
  },
  tickets: {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-08.jpg",
    alt: "Ferry ticket booths at Positano port with timetable boards.",
    caption: "Ticket booths: check the sign for the next departure.",
    aspect: "16/9",
  },
  port: {
    src: "/img/directions/hostel-brikette-to-ferry-dock/step-09.jpg",
    alt: "View of Positano port with a ferry in the foreground and Positano hillside behind.",
    caption: "Positano port: wait near the end of the pier for boarding calls.",
    aspect: "16/9",
  },
} as const;

function renderInlineLinks(
  value: string,
  keyPrefix: string,
  context: GuideSeoTemplateContext,
): ReactNode {
  inlineLinkPattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  const parts: ReactNode[] = [];

  while ((match = inlineLinkPattern.exec(value))) {
    if (match.index > lastIndex) {
      const textSegment = value.slice(lastIndex, match.index);
      if (textSegment) {
        parts.push(<Fragment key={`${keyPrefix}-text-${match.index}`}>{textSegment}</Fragment>);
      }
    }

    const labelRaw = match[1];
    const hrefRaw = match[2];
    if (!labelRaw || !hrefRaw) {
      lastIndex = inlineLinkPattern.lastIndex;
      continue;
    }
    const label = labelRaw.trim();
    const href = hrefRaw.trim();
    const key = `${keyPrefix}-link-${match.index}`;

    if (href.startsWith(GUIDE_SCHEME_PREFIX)) {
      const guideKey = href.slice(GUIDE_SCHEME_PREFIX.length).trim();
        if (guideKey.length > 0) {
          parts.push(
            <Link
              key={key}
              to={guideHref(context.lang, guideKey as GuideKey)}
              prefetch="intent"
              className="inline-flex min-h-11 min-w-11 items-center align-middle font-medium text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary"
            >
              {label}
            </Link>,
          );
      } else {
        parts.push(
          <Fragment key={key}>
            {label}
          </Fragment>,
        );
      }
    } else if (href.startsWith("/")) {
      parts.push(
        <Link
          key={key}
          to={href}
          prefetch="intent"
          className="inline-flex min-h-11 min-w-11 items-center align-middle font-medium text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary"
        >
          {label}
        </Link>,
      );
    } else {
      parts.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 min-w-11 items-center align-middle font-medium text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary"
        >
          {label}
        </a>,
      );
    }

    lastIndex = inlineLinkPattern.lastIndex;
  }

  if (lastIndex < value.length) {
    const textSegment = value.slice(lastIndex);
    if (textSegment) {
      parts.push(<Fragment key={`${keyPrefix}-text-${lastIndex}`}>{textSegment}</Fragment>);
    }
  }

  return parts.length > 0 ? parts : value;
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
            <p key={index} className="leading-relaxed">
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
              <li key={index} className="leading-relaxed">
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
              <li key={index} className="leading-relaxed">
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
              <li key={index} className="leading-relaxed">
                {renderInlineLinks(item, `knees-${index}`, context)}
              </li>
            ))}
            {kneesDockPrefix && kneesDockLinkText ? (
              <li className="leading-relaxed">
                {kneesDockPrefix}{" "}
                <Link
                  to={guideHref(context.lang, "chiesaNuovaArrivals")}
                  className="inline-flex min-h-11 min-w-11 items-center align-middle font-medium text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary"
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
                  to={guideHref(context.lang, "porterServices")}
                  className="inline-flex min-h-11 min-w-11 items-center align-middle font-medium text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary"
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
                key={index}
                className="rounded-lg border border-brand-outline/20 bg-brand-surface/80 p-4 shadow-sm transition hover:border-brand-primary/40 dark:border-brand-outline/40 dark:bg-brand-surface/30"
              >
                <summary className="cursor-pointer text-base font-semibold text-brand-heading outline-none transition focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2 dark:text-brand-surface">
                  {faq.q}
                </summary>
                <div className="mt-3 space-y-3">
                  {faq.a.map((answer, answerIndex) => (
                    <p key={answerIndex} className="leading-relaxed">
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
