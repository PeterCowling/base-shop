 
// src/routes/guides/positano-on-a-backpacker-budget/_createArticleLead.tsx
import { type ReactNode } from "react";
import { Link } from "react-router-dom";

import { Inline } from "@acme/ui/components/atoms/primitives/Inline";

import GenericContent from "@/components/guides/GenericContent";
import { guideHref, type GuideKey } from "@/routes.guides-helpers";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";
import { renderGuideLinkTokens } from "../utils/linkTokens";

import { GUIDE_KEY, SECTION_IDS } from "./constants";
import { getGuidesTranslator } from "./translations";
import type { GuideExtras } from "./types";

type TitledItem = {
  title: string;
  rest: string;
};

const MAX_TITLE_WORDS = 6;
const SECTION_CLASSNAME = "scroll-mt-28 space-y-4"; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Layout-only classes
const SECTION_HEADING_CLASSNAME =
  "text-xl font-semibold tracking-tight text-brand-heading"; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Layout-only classes
const LINK_TONE_CLASSNAME =
  "[&_a]:font-medium [&_a]:text-brand-primary/80 [&_a:hover]:text-brand-primary"; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Layout-only classes
const DAY_LIST_CLASSNAME =
  `not-prose space-y-3 text-base leading-relaxed text-brand-text/90 text-pretty ${LINK_TONE_CLASSNAME}`; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Layout-only classes
const SAVINGS_LIST_CLASSNAME =
  `not-prose grid gap-3 sm:grid-cols-2 ${LINK_TONE_CLASSNAME}`; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Layout-only classes
const TRANSPORT_LIST_CLASSNAME =
  "not-prose space-y-3 text-base leading-relaxed text-brand-text/90 text-pretty"; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Layout-only classes
const BULLET_CLASSNAME = "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary/70"; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Layout-only classes

function splitTitledItem(value: string): TitledItem | null {
  const colonIndex = value.indexOf(":");
  if (colonIndex <= 0) return null;
  const title = value.slice(0, colonIndex).trim();
  const rest = value.slice(colonIndex + 1).trim();
  if (!title || !rest) return null;
  const titleWordCount = title.split(/\s+/u).filter(Boolean).length;
  if (titleWordCount > MAX_TITLE_WORDS) return null;
  return { title, rest };
}

function renderScheduleItem(value: string, lang: GuideSeoTemplateContext["lang"], keyBase: string): ReactNode {
  const split = splitTitledItem(value);
  if (!split) {
    return (
      <div className="text-base leading-relaxed text-brand-text/90 text-pretty">
        {renderGuideLinkTokens(value, lang, keyBase)}
      </div>
    );
  }
  return (
    <Inline gap={4} alignY="start">
      <span className="text-xs font-semibold uppercase tracking-widest text-brand-primary/70 flex-none">
        {split.title}
      </span>
      <span className="text-base leading-relaxed text-brand-text/90 text-pretty flex-1 min-w-0">
        {renderGuideLinkTokens(split.rest, lang, `${keyBase}-rest`)}
      </span>
    </Inline>
  );
}

export function createArticleLead(
  buildExtras: (context: GuideSeoTemplateContext) => GuideExtras,
  context: GuideSeoTemplateContext,
): JSX.Element {
  const extras = buildExtras(context);

  if (!extras.hasStructured) {
    return <GenericContent t={context.translator} guideKey={GUIDE_KEY} />;
  }

  const transportExtras = extras.transport;
  const guidesTranslator = getGuidesTranslator(context.lang);
  const guidesFallback = getGuidesTranslator("en");
  const resolveLinkLabel = (key: GuideKey) =>
    getGuideLinkLabel(guidesTranslator, guidesFallback, key) || key;

  return (
    <>
      {extras.intro.map((paragraph, index) => (
        <p key={index} className="text-pretty">
          {renderGuideLinkTokens(paragraph, context.lang, `intro-${index}`)}
        </p>
      ))}

      {extras.days.map((day) => (
        <section key={day.id} id={day.id} className={SECTION_CLASSNAME}>
          <h2 className={SECTION_HEADING_CLASSNAME}>{day.title}</h2>
          <ul className={DAY_LIST_CLASSNAME}>
            {day.items.map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className={BULLET_CLASSNAME} aria-hidden="true" />
                {renderScheduleItem(item, context.lang, `day-${day.id}-${index}`)}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {extras.savings.title && extras.savings.items.length > 0 ? (
        <section id={SECTION_IDS.savings} className={SECTION_CLASSNAME}>
          <h2 className={SECTION_HEADING_CLASSNAME}>{extras.savings.title}</h2>
          <ul className={SAVINGS_LIST_CLASSNAME}>
            {extras.savings.items.map((item, index) => (
              <li
                key={index}
                className="flex gap-3 rounded-xl border border-brand-outline/40 bg-brand-surface/60 px-4 py-3 text-sm leading-relaxed text-brand-text/80 text-pretty dark:border-brand-outline/30 dark:bg-brand-text/10"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-primary/60" aria-hidden="true" />
                <span>{renderGuideLinkTokens(item, context.lang, `saving-${index}`)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {extras.food.title ? (
        <section id={SECTION_IDS.food} className={SECTION_CLASSNAME}>
          <h2 className={SECTION_HEADING_CLASSNAME}>{extras.food.title}</h2>
          {extras.food.text ? (
            <p className="text-base leading-relaxed text-brand-text/90 text-pretty">
              {renderGuideLinkTokens(extras.food.text, context.lang, "food-text")}
            </p>
          ) : null}
        </section>
      ) : null}

      {transportExtras ? (
        <section id={SECTION_IDS.transport} className={SECTION_CLASSNAME}>
          <h2 className={SECTION_HEADING_CLASSNAME}>{transportExtras.title}</h2>
          <ul className={TRANSPORT_LIST_CLASSNAME}>
            {transportExtras.compareLabel || transportExtras.compareLinks.length > 0 ? (
              <li className="space-y-2">
                {transportExtras.compareLabel ? (
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-text/60">
                    {transportExtras.compareLabel}
                  </p>
                ) : null}
                {transportExtras.compareLinks.length > 0 ? (
                  <Inline gap={2} className="text-sm">
                    {transportExtras.compareLinks.map(({ key, label }, index) => (
                      <Link
                        key={`${key}-${index}`}
                        to={guideHref(context.lang, key)}
                        className="rounded-full border border-brand-outline/40 bg-brand-surface/60 px-3 py-1 text-sm font-semibold text-brand-primary/80 no-underline transition hover:border-brand-primary/40 hover:text-brand-primary dark:border-brand-outline/30 dark:bg-brand-text/10"
                      >
                        {label && label.length > 0 ? label : resolveLinkLabel(key)}
                      </Link>
                    ))}
                  </Inline>
                ) : null}
              </li>
            ) : null}
            {transportExtras.ferryPrefix || transportExtras.ferryLinkLabel || transportExtras.ferrySuffix ? (
              <li className="rounded-xl border border-brand-outline/40 bg-brand-surface/60 px-4 py-3 text-sm leading-relaxed text-brand-text/80 dark:border-brand-outline/30 dark:bg-brand-text/10">
                <Inline gap={2} className="flex-wrap text-sm">
                  {transportExtras.ferryPrefix ? <span>{transportExtras.ferryPrefix}</span> : null}
                  <Link
                    to={guideHref(context.lang, "ferrySchedules")}
                    className="font-semibold text-brand-primary/90 underline-offset-4 hover:underline"
                  >
                    {transportExtras.ferryLinkLabel || resolveLinkLabel("ferrySchedules")}
                  </Link>
                  {transportExtras.ferrySuffix ? <span>{transportExtras.ferrySuffix}</span> : null}
                </Inline>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {extras.faqs.length > 0 ? (
        <section id="faqs" className={SECTION_CLASSNAME}>
          <h2 className={SECTION_HEADING_CLASSNAME}>{extras.faqsTitle || "FAQs"}</h2>
          {extras.faqs.map((faq, index) => (
            <details key={index}>
              <summary>{faq.q}</summary>
              {faq.a.map((answer, answerIndex) => (
                <p key={answerIndex}>
                  {renderGuideLinkTokens(answer, context.lang, `faq-${index}-${answerIndex}`)}
                </p>
              ))}
            </details>
          ))}
        </section>
      ) : null}
    </>
  );
}
