import { LOCALES } from "@acme/i18n/locales";

export default function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
