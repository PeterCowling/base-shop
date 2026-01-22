import type { Locale } from "@acme/i18n/locales";
import type { TranslatableText } from "@acme/types/i18n";
import AnnouncementBar from "@acme/ui/components/organisms/AnnouncementBar";

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
