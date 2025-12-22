import * as I18n from "react-i18next";
import type { ComponentType, ReactNode } from "react";
import type { TFunction } from "i18next";

type TransLikeProps = {
  children?: ReactNode;
  t?: TFunction;
  i18nKey?: string;
  defaultValue?: string;
  components?: Record<string, JSX.Element>;
};

// Some tests mock `react-i18next` without exporting `Trans`.
// Vitest throws when accessing a missing named export on a mocked module.
// Safely probe for `Trans` and fall back to a pass-through component.
let MaybeTrans: unknown;
try {
  MaybeTrans = (I18n as unknown as { Trans?: unknown }).Trans;
} catch {
  MaybeTrans = undefined;
}
const Trans: ComponentType<TransLikeProps> =
  typeof MaybeTrans === "function"
    ? (MaybeTrans as ComponentType<TransLikeProps>)
    : (({ children }: TransLikeProps) => <>{children}</>);

const useTranslation = (I18n as unknown as {
  useTranslation: (
    ns?: string,
    opts?: { lng?: AppLanguage } | undefined,
  ) => { t: TFunction };
}).useTranslation;

import ImageGallery from "@/components/guides/ImageGallery";
import TableOfContents from "@/components/guides/TableOfContents";
import { renderGuideLinkTokens } from "../utils/linkTokens";
import type { AppLanguage } from "@/i18n.config";

import { buildComponents } from "./componentTokens";
import type { FallbackData } from "./types";

export function FallbackContent({ data, lang }: { data: FallbackData; lang: AppLanguage }): JSX.Element {
  const { t } = useTranslation("guides", { lng: lang });

  return (
    <>
      {data.intro.map((paragraph, index) => (
        <p key={`intro-${index}`}>{renderGuideLinkTokens(paragraph, lang, `intro-${index}`)}</p>
      ))}

      {data.tocItems.length > 0 ? <TableOfContents items={data.tocItems} /> : null}

      {data.galleryItems.length > 0 ? <ImageGallery items={data.galleryItems} /> : null}

      {data.sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          {section.paragraphs?.map((block, index) => (
            <p key={`${section.id}-p-${index}`}>
              <Trans
                t={t}
                i18nKey={block.i18nKey}
                defaultValue={block.defaultValue}
                components={buildComponents(lang, block.componentTokens)}
              />
            </p>
          ))}
          {section.listItems ? (
            <ul>
              {section.listItems.map((block, index) => (
                <li key={`${section.id}-li-${index}`}>
                  <Trans
                    t={t}
                    i18nKey={block.i18nKey}
                    defaultValue={block.defaultValue}
                    components={buildComponents(lang, block.componentTokens)}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {data.tips.length > 0 ? (
        <section id="tips">
          {data.tipsTitle ? <h2>{data.tipsTitle}</h2> : null}
          <ul>
            {data.tips.map((tip, index) => (
              <li key={`tip-${index}`}>{renderGuideLinkTokens(tip, lang, `tip-${index}`)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.faqs.length > 0 ? (
        <section id={data.faqId}>
          {data.faqsTitle ? <h2>{data.faqsTitle}</h2> : null}
          {data.faqs.map((faq) => (
            <details key={faq.questionKey}>
              <summary>{faq.question}</summary>
              <p>
                <Trans
                  t={t}
                  i18nKey={faq.answerKey}
                  defaultValue={faq.defaultAnswer}
                  components={buildComponents(lang, faq.componentTokens)}
                />
              </p>
            </details>
          ))}
        </section>
      ) : null}
    </>
  );
}
