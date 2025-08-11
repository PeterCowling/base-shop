import type { Locale } from "@/i18n/locales";
import Header, { type NavSection } from "../../organisms/Header";

interface Props {
  nav?: NavSection[];
  logo?: string;
  locale: Locale;
}

/** CMS wrapper for the Header organism */
export default function HeaderBlock({ nav = [], logo, locale }: Props) {
  return <Header nav={nav} logo={logo} locale={locale} />;
}
