import type { AppLanguage } from "@/i18n.config";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";
import { slugifyWithFallback } from "@/utils/slugify";

import {
  FALLBACK_GALLERY,
  POSITANO_TRAVEL_GUIDE_FALLBACK_KEY,
} from "./constants";
import { getGuidesTranslator } from "./i18n";
import type {
  ComponentToken,
  FallbackBlock,
  FallbackContentRecord,
  FallbackData,
  FallbackFaq,
  FallbackGalleryItem,
  FallbackSection,
  SectionRecord,
} from "./types";

type SectionFieldTokens = { field: string; tokens?: ComponentToken[] };

function toRecord(value: unknown): SectionRecord {
  return typeof value === "object" && value !== null ? (value as SectionRecord) : {};
}

function toStringArray(value: unknown): string[] {
  return ensureStringArray(value).map((item) => item.trim()).filter((item) => item.length > 0);
}

function resolveLabel(raw: unknown, fallback: string): string {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return fallback;
}

function buildFallbackKey(...segments: readonly string[]): string {
  return [POSITANO_TRAVEL_GUIDE_FALLBACK_KEY, ...segments].join(".");
}

export function createFallbackData(lang: AppLanguage): FallbackData {
  const t = getGuidesTranslator(lang);
  const tEn = getGuidesTranslator("en");

  const fallbackContentRaw = t(POSITANO_TRAVEL_GUIDE_FALLBACK_KEY, {
    returnObjects: true,
    defaultValue: {},
  }) as FallbackContentRecord;
  const fallbackDefaultsRaw = tEn(POSITANO_TRAVEL_GUIDE_FALLBACK_KEY, {
    returnObjects: true,
    defaultValue: {},
  }) as FallbackContentRecord;

  const intro = toStringArray(fallbackContentRaw.intro ?? fallbackDefaultsRaw.intro);

  const sectionsRecord = toRecord(fallbackContentRaw.sections);
  const sectionsDefaultRecord = toRecord(fallbackDefaultsRaw.sections);

  function buildSection(
    key: string,
    paragraphKeys: SectionFieldTokens[] = [{ field: "body" }],
    listKeys?: SectionFieldTokens[],
  ): FallbackSection | null {
    const localized = toRecord(sectionsRecord[key]);
    const defaults = toRecord(sectionsDefaultRecord[key]);
    const title = resolveLabel(localized["title"], resolveLabel(defaults["title"], ""));
    if (title.length === 0) {
      return null;
    }
    const id = slugifyWithFallback(title, key);
    const paragraphs = paragraphKeys.reduce<FallbackBlock[]>((acc, { field, tokens }) => {
      const defaultValue = resolveLabel(defaults[field], "");
      const value = resolveLabel(localized[field], defaultValue);
      if (!value.length && !defaultValue.length) {
        return acc;
      }
      if (defaultValue.length === 0) {
        return acc;
      }
      acc.push({
        i18nKey: buildFallbackKey("sections", key, field),
        defaultValue,
        ...(tokens && tokens.length > 0 ? { componentTokens: tokens } : {}),
      });
      return acc;
    }, []);

    const listItems = listKeys
      ? listKeys.reduce<FallbackBlock[]>((acc, { field, tokens }) => {
          const defaultValue = resolveLabel(defaults[field], "");
          const value = resolveLabel(localized[field], defaultValue);
          if (!value.length && !defaultValue.length) {
            return acc;
          }
          if (defaultValue.length === 0) {
            return acc;
          }
          acc.push({
            i18nKey: buildFallbackKey("sections", key, field),
            defaultValue,
            ...(tokens && tokens.length > 0 ? { componentTokens: tokens } : {}),
          });
          return acc;
        }, [])
      : undefined;

    return {
      id,
      title,
      ...(paragraphs.length > 0 ? { paragraphs } : {}),
      ...(listItems && listItems.length > 0 ? { listItems } : {}),
    } satisfies FallbackSection;
  }

  const sections = [
    buildSection("whereToStay", [{ field: "body", tokens: ["em"] }]),
    buildSection("whenToVisit", [{ field: "body", tokens: ["linkBestTime"] }]),
    buildSection(
      "gettingAround",
      [],
      [
        { field: "arrivals", tokens: ["strong", "linkHowTo", "linkNaples", "linkSalerno"] },
        { field: "withinTown", tokens: ["strong", "em"] },
        { field: "ferries", tokens: ["strong", "linkFerries"] },
      ],
    ),
    buildSection(
      "thingsToDo",
      [],
      [
        { field: "beaches", tokens: ["linkBeaches"] },
        { field: "pathOfTheGods", tokens: ["linkPath"] },
        { field: "dayTrips", tokens: ["linkCapri", "linkAmalfi", "linkRavello"] },
      ],
    ),
    buildSection(
      "moneySavers",
      [],
      [
        { field: "eat", tokens: ["linkCheapEats"] },
        { field: "travel", tokens: ["linkBudgetArrival"] },
        { field: "stay", tokens: ["em"] },
      ],
    ),
  ].filter((section): section is FallbackSection => section != null);

  const faqHeading = resolveLabel(
    fallbackContentRaw.faqHeading,
    resolveLabel(fallbackDefaultsRaw.faqHeading, "FAQs"),
  );
  const faqId = slugifyWithFallback(faqHeading, "faqs");

  const fallbackFaqsDefaults = ensureArray(fallbackDefaultsRaw.faqs);
  const hasExplicitFallbackFaqs = Object.prototype.hasOwnProperty.call(
    fallbackContentRaw,
    "faqs",
  );
  const fallbackFaqsRaw = ensureArray(fallbackContentRaw.faqs);
  const faqSource = hasExplicitFallbackFaqs ? fallbackFaqsRaw : fallbackFaqsDefaults;
  const fallbackFaqComponents: Array<ComponentToken[] | undefined> = [undefined, ["em"]];
  const faqs = faqSource.reduce<FallbackFaq[]>((acc, rawFaq, index) => {
    const localizedRecord = toRecord(rawFaq);
    const defaultRecord = toRecord(fallbackFaqsDefaults[index]);
    const question = resolveLabel(localizedRecord["question"], resolveLabel(defaultRecord["question"], ""));
    const defaultAnswer = resolveLabel(defaultRecord["answer"], resolveLabel(localizedRecord["answer"], ""));
    if (!question.length || !defaultAnswer.length) {
      return acc;
    }
    acc.push({
      question,
      questionKey: buildFallbackKey("faqs", String(index), "question"),
      answerKey: buildFallbackKey("faqs", String(index), "answer"),
      defaultAnswer,
      ...(fallbackFaqComponents[index] && fallbackFaqComponents[index]?.length
        ? { componentTokens: fallbackFaqComponents[index] }
        : {}),
    });
    return acc;
  }, []);

  const galleryRecord = toRecord(fallbackContentRaw.gallery);
  const galleryDefaults = toRecord(fallbackDefaultsRaw.gallery);
  const galleryItemsRaw = ensureArray(galleryRecord["items"]);
  const galleryItemsDefaults = ensureArray(galleryDefaults["items"]);
  const galleryItems = FALLBACK_GALLERY.reduce<FallbackGalleryItem[]>((items, src, index) => {
    const localized = toRecord(galleryItemsRaw[index]);
    const defaults = toRecord(galleryItemsDefaults[index]);
    const alt = resolveLabel(localized["alt"], resolveLabel(defaults["alt"], ""));
    if (!alt.length) {
      return items;
    }
    const caption = resolveLabel(localized["caption"], resolveLabel(defaults["caption"], ""));
    items.push({ src, alt, caption });
    return items;
  }, []);

  const tipsTitle = resolveLabel(
    fallbackContentRaw.tipsTitle,
    resolveLabel(fallbackDefaultsRaw.tipsTitle, ""),
  );
  const tips = toStringArray(fallbackContentRaw.tips ?? fallbackDefaultsRaw.tips);

  const tocItems: { href: string; label: string }[] = [
    ...sections.map((section) => ({ href: `#${section.id}`, label: section.title })),
    ...(tips.length > 0 && tipsTitle.length > 0 ? [{ href: "#tips", label: tipsTitle }] : []),
    ...(faqs.length > 0 ? [{ href: `#${faqId}`, label: faqHeading }] : []),
  ].filter((item) => item.label.length > 0);

  const atAGlanceDefault = resolveLabel(fallbackDefaultsRaw.atAGlanceLabel, "At a glance");
  const atAGlanceLabel = resolveLabel(fallbackContentRaw.atAGlanceLabel, atAGlanceDefault);

  return {
    intro,
    tocItems,
    galleryItems,
    sections,
    costSection: { atAGlanceLabel },
    ...(tipsTitle.length > 0 ? { tipsTitle } : {}),
    tips,
    ...(faqHeading.length > 0 ? { faqsTitle: faqHeading } : {}),
    faqs,
    faqId,
    hasFallbackContent:
      intro.length > 0 || sections.length > 0 || tips.length > 0 || galleryItems.length > 0 || faqs.length > 0,
  } satisfies FallbackData;
}
