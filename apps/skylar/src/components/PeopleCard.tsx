'use client';

import Image from "next/image";

import { useTranslations } from "@acme/i18n";

import type { PersonDefinition } from "@/data/people";
import { CRISTIANA_WECHAT_QR_IMAGE } from "@/lib/assets";
import type { Locale } from "@/lib/locales";
import { MILAN_CLASSES } from "@/styles/milan";

type PeopleCardProps = {
  definition: PersonDefinition;
  lang: Locale;
};

export default function PeopleCard({ definition, lang }: PeopleCardProps) {
  const translator = useTranslations();
  const isZh = lang === "zh";
  const isIt = lang === "it";
  const borderColor = isZh ? "border-accent/60" : "border-border";
  const background = isZh ? "bg-zinc-900/80" : "bg-panel";
  const textColor = isZh ? "text-zinc-100" : "text-fg";
  const accent = isZh ? "text-accent" : "text-fg";
  const contactEntries = [
    {
      labelKey: definition.contact.phoneLabelKey,
      valueKey: definition.contact.phoneValueKey,
    },
    {
      labelKey: definition.contact.emailLabelKey,
      valueKey: definition.contact.emailValueKey,
    },
    {
      labelKey: definition.contact.websiteLabelKey,
      valueKey: definition.contact.websiteValueKey,
    },
  ];

  if (isIt) {
    const primaryName = translator(definition.nameKey);
    const portraitLetter = primaryName.charAt(0).toUpperCase();
    return (
      <article className={MILAN_CLASSES.personCard}>
        <div className="milan-person-card__portrait" aria-hidden="true">
          <span>{portraitLetter}</span>
        </div>
        <div className={MILAN_CLASSES.personHeader}>
          <div className="milan-person-card__identity">
            <p className={MILAN_CLASSES.personName}>{primaryName}</p>
            <p className={MILAN_CLASSES.personSubtitle}>
              {translator(definition.titleKey)}
            </p>
          </div>
        </div>
        <div className={MILAN_CLASSES.personSummary}>
          {definition.summaryKeys.map((key) => (
            <p key={key}>{translator(key)}</p>
          ))}
        </div>
        <div className={MILAN_CLASSES.personContact}>
          <div className="milan-person-card__contact-grid">
            {contactEntries.map((item, index) => (
              <div key={`${definition.key}-it-contact-${index}`} className="milan-person-card__contact-row">
                <p className={MILAN_CLASSES.personLabel}>
                  {translator(item.labelKey)}
                </p>
                <p className={MILAN_CLASSES.personValue}>
                  {translator(item.valueKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </article>
    );
  }

  if (isZh) {
    const titleEn = definition.titleEnKey
      ? translator(definition.titleEnKey)
      : translator(definition.titleKey);
    const nameCn = definition.secondaryNameKey
      ? translator(definition.secondaryNameKey)
      : translator(definition.nameKey);

    return (
      <article className="zh-card zh-people-card">
        <div className="zh-people-card__names">
          <p className="zh-people-card__name-cn">{nameCn}</p>
          <p className="zh-people-card__name-en">{translator(definition.nameKey)}</p>
        </div>
        <div className="zh-people-card__roles">
          <p className="zh-people-card__role-zh">{translator(definition.titleKey)}</p>
          <p className="zh-people-card__role-en">{titleEn}</p>
        </div>
        <div className="zh-people-card__services">
          {definition.summaryKeys.map((key) => (
            <p key={key}>{translator(key)}</p>
          ))}
        </div>
        <div className="zh-contact__rows">
          {contactEntries.map((item, index) => (
            <div key={`${definition.key}-zh-contact-${index}`} className="zh-contact__row">
              <span>{translator(item.labelKey)}：</span>
              {translator(item.valueKey)}
            </div>
          ))}
        </div>
        {definition.contact.wechatCaptionKey && definition.contact.wechatValueKey && (
          <div className="zh-contact__qr">
            <div className="zh-contact__qr-box" aria-hidden="true">
              <span className="sr-only">{translator(definition.contact.wechatCaptionKey)}</span>
              <Image
                src={CRISTIANA_WECHAT_QR_IMAGE}
                alt={translator("people.cristiana.contact.wechatImageAlt")}
                width={120}
                height={120}
              />
            </div>
            <div className="zh-contact__qr-meta">
              <p>{translator(definition.contact.wechatCaptionKey)}</p>
              <p>{translator(definition.contact.wechatValueKey)}</p>
            </div>
          </div>
        )}
      </article>
    );
  }

  const primaryName = translator(definition.nameKey);
  const portraitLetter = primaryName.charAt(0).toUpperCase();

  return (
    <article className={`people-en-card rounded-3xl border p-6 md:p-8 ${borderColor} ${background} ${textColor}`}>
      <div className="people-en-card__portrait" aria-hidden="true">
        <span>{portraitLetter}</span>
      </div>
      <div className="people-en-card__header">
        <p className="people-en-card__name">{primaryName}</p>
      </div>
      <div className="people-en-card__roles">
        <p className="people-en-card__title">{translator(definition.titleKey)}</p>
        {definition.cardLineKey && translator(definition.cardLineKey) && (
          <p className={`people-en-card__line ${accent}`}>
            {translator(definition.cardLineKey)}
          </p>
        )}
      </div>
      <div className="people-en-card__summary">
        {definition.summaryKeys.map((key) => (
          <p key={key}>{translator(key)}</p>
        ))}
      </div>
      <div className="people-en-card__contacts">
        {contactEntries.map((item, index) => (
          <div key={`${definition.key}-${index}`}>
            <p className="people-en-card__label">{translator(item.labelKey)}</p>
            <p className="people-en-card__value">
              {translator(item.valueKey)}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}
