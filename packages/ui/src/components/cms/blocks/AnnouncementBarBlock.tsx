import AnnouncementBar from "../../organisms/AnnouncementBar";
import type { TranslatableText } from "@acme/types/i18n";
import type { Locale } from "@acme/i18n/locales";

interface Props {
  text?: TranslatableText;
  link?: string;
  closable?: boolean;
  locale?: Locale;
}

/** CMS wrapper for the AnnouncementBar organism */
export default function AnnouncementBarBlock({ text, link, closable, locale }: Props) {
  if (!text) return null;
  return <AnnouncementBar text={text} href={link} closable={closable} locale={locale} />;
}
