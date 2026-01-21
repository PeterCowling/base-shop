 
import { Fragment } from "react";
import { Link } from "react-router-dom";
import type { TFunction } from "i18next";

import ImageGallery from "@/components/guides/ImageGallery";
import TableOfContents from "@/components/guides/TableOfContents";
import appI18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { guideHref } from "@/routes.guides-helpers";
import { getOptionalString } from "@/utils/translationFallbacks";

import { renderGuideLinkTokens } from "../utils/linkTokens";

import { GUIDE_KEY } from "./constants";
import type { FallbackData, FallbackListItem } from "./types";

interface FallbackArticleProps {
  data: FallbackData;
  lang: AppLanguage;
  translator: TFunction<"guides">;
}

function renderListItem(
  item: FallbackListItem,
  lang: AppLanguage,
  translator: TFunction<"guides">,
  fallbackTranslator: TFunction<"guides">,
  index: number,
  fallbackTitle: string,
): JSX.Element {
  const title = item.title?.trim();
  const description = item.description?.trim();
  const linkKey = item.link?.guideKey;
  const linkHref = linkKey ? guideHref(lang, linkKey) : null;
  let linkLabel = title || fallbackTitle;

  if (linkKey && linkHref) {
    const labelKey = `content.${linkKey}.linkLabel`;
    const translatedLabel = getOptionalString(translator, labelKey);

    if (translatedLabel) {
      linkLabel = translatedLabel;
    } else if (!title) {
      const fallbackLabel = getOptionalString(fallbackTranslator, labelKey);
      if (fallbackLabel) {
        linkLabel = fallbackLabel;
      }
    }
  }

  return (
    <li key={`${fallbackTitle}-${index}`}>
      {title ? (
        <span role="heading" aria-level={3} className="font-semibold">
          {renderGuideLinkTokens(title, lang, `${fallbackTitle}-${index}-title`).map((node, i) => (
            <Fragment key={i}>{node}</Fragment>
          ))}
        </span>
      ) : null}
      {title && (description || linkHref) ? " — " : null}
      {linkHref ? <Link to={linkHref}>{linkLabel}</Link> : null}
      {linkHref && description ? ": " : null}
      {description
        ? renderGuideLinkTokens(description, lang, `${fallbackTitle}-${index}-desc`).map((node, i) => (
            <Fragment key={i}>{node}</Fragment>
          ))
        : null}
    </li>
  );
}

const fallbackGuides = appI18n.getFixedT("en", "guides") as TFunction<"guides">;

export default function FallbackArticle({ data, lang, translator }: FallbackArticleProps): JSX.Element {
  const tocItems = data.toc
    .map((item) => {
      const href = item.href?.trim();
      const label = item.label?.trim();
      if (!href || !label) {
        return null;
      }
      return { href, label };
    })
    .filter((item): item is { href: string; label: string } => item !== null);

  const galleryItems = data.gallery
    .map((item) => {
      const src = item.src?.trim();
      const alt = item.alt?.trim();
      if (!src) {
        return null;
      }
      return { src, alt: alt ?? "" };
    })
    .filter((item): item is { src: string; alt: string } => item !== null);

  return (
    <article className="prose prose-slate dark:prose-invert">
      <h1>{translator(`content.${GUIDE_KEY}.seo.title`)}</h1>

      {data.intro.map((paragraph, index) => (
        <p key={`intro-${index}`}>
          {renderGuideLinkTokens(paragraph, lang, `intro-${index}`).map((node, i) => (
            <Fragment key={i}>{node}</Fragment>
          ))}
        </p>
      ))}

      {tocItems.length > 0 ? <TableOfContents items={tocItems} /> : null}

      {galleryItems.length > 0 ? <ImageGallery items={galleryItems} /> : null}

      {data.classics ? (
        <section id="classics">
          <h2>{data.classics.heading}</h2>
          <ul>
            {data.classics.items.map((item, index) =>
              renderListItem(item, lang, translator, fallbackGuides, index, "classic"),
            )}
          </ul>
        </section>
      ) : null}

      {data.alternatives ? (
        <section id="alternatives">
          <h2>{data.alternatives.heading}</h2>
          <ul>
            {data.alternatives.items.map((item, index) =>
              renderListItem(item, lang, translator, fallbackGuides, index, "alternative"),
            )}
          </ul>
        </section>
      ) : null}

      {data.sunset ? (
        <section id="sunset">
          <h2>{data.sunset.heading}</h2>
          {data.sunset.paragraphs.map((paragraph, index) => (
            <p key={`sunset-${index}`}>
              {renderGuideLinkTokens(paragraph, lang, `sunset-${index}`).map((node, i) => (
                <Fragment key={i}>{node}</Fragment>
              ))}
            </p>
          ))}
        </section>
      ) : null}

      {data.etiquette ? (
        <section id="etiquette">
          <h2>{data.etiquette.heading}</h2>
          <ul>
            {data.etiquette.items.map((item, index) => (
              <li key={`etiquette-${index}`}>
                {renderGuideLinkTokens(item, lang, `etiquette-${index}`).map((node, i) => (
                  <Fragment key={i}>{node}</Fragment>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.faqs ? (
        <section id="faqs">
          <h2>{data.faqs.heading}</h2>
          {data.faqs.items.map((item, index) => (
            <details key={`faq-${index}`}>
              {item.summary ? (
                <summary role="button">
                  {renderGuideLinkTokens(item.summary, lang, `faq-summary-${index}`).map((node, i) => (
                    <Fragment key={i}>{node}</Fragment>
                  ))}
                </summary>
              ) : null}
              {item.body ? (
                <p>
                  {renderGuideLinkTokens(item.body, lang, `faq-body-${index}`).map((node, i) => (
                    <Fragment key={i}>{node}</Fragment>
                  ))}
                </p>
              ) : null}
            </details>
          ))}
        </section>
      ) : null}

      {data.drone ? (
        <details>
          {data.drone.summary ? (
            <summary role="button">
              {renderGuideLinkTokens(data.drone.summary, lang, "drone-summary").map((node, i) => (
                <Fragment key={i}>{node}</Fragment>
              ))}
            </summary>
          ) : null}
          {data.drone.body ? (
            <p>
              {renderGuideLinkTokens(data.drone.body, lang, "drone-body").map((node, i) => (
                <Fragment key={i}>{node}</Fragment>
              ))}
            </p>
          ) : null}
        </details>
      ) : null}
    </article>
  );
}
