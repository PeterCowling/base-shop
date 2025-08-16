import type { Locale } from "@/i18n/locales";
import { Footer, type FooterLink } from "../../organisms/Footer";

interface Props {
  links?: FooterLink[];
  logo?: string;
  locale: Locale;
}

/** CMS wrapper for the Footer organism */
export default function FooterBlock({ links = [], logo }: Props) {
  return <Footer links={links} logo={logo} />;
}
