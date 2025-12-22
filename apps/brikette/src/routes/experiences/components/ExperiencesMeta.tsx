/* src/routes/experiences/components/ExperiencesMeta.tsx */
import ExperiencesStructuredData from "@/components/seo/ExperiencesStructuredData";
import { Fragment } from "react";
import { BASE_URL } from "@/config/site";
import { getSlug } from "@/utils/slug";
import {
  JSON_LD_MIME_TYPE,
  META_DESCRIPTION_NAME,
  OG_DESCRIPTION_PROPERTY,
  OG_LOCALE_ALTERNATE_PROPERTY,
  OG_LOCALE_PROPERTY,
  OG_TITLE_PROPERTY,
} from "../constants";
import type { ExperiencesMetaData } from "../types";

type ExperiencesMetaProps = {
  meta: ExperiencesMetaData;
};

export function ExperiencesMeta({ meta }: ExperiencesMetaProps) {
  const { title, desc, lang, supportedLngs, faqJson } = meta;
  const canonical = `${BASE_URL}/${lang}/${getSlug("experiences", lang)}`;
  const defaultLang = supportedLngs[0] ?? lang;

  return (
    <Fragment>
      <title>{title}</title>
      <meta name={META_DESCRIPTION_NAME} content={desc} />
      <meta property={OG_TITLE_PROPERTY} content={title} />
      <meta property={OG_DESCRIPTION_PROPERTY} content={desc} />
      <meta property={OG_LOCALE_PROPERTY} content={lang} />
      <link rel="canonical" href={canonical} />
      {supportedLngs.map((l) => (
        <link key={`alt-${l}`} rel="alternate" hrefLang={l} href={`${BASE_URL}/${l}/${getSlug("experiences", l)}`} />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${BASE_URL}/${defaultLang}/${getSlug("experiences", defaultLang)}`}
      />
      {supportedLngs
        .filter((supported) => supported !== lang)
        .map((supported) => (
          <meta key={supported} property={OG_LOCALE_ALTERNATE_PROPERTY} content={supported} />
        ))}

      <ExperiencesStructuredData />
      {faqJson ? (
        <script
          type={JSON_LD_MIME_TYPE}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: faqJson }}
        />
      ) : null}
    </Fragment>
  );
}
