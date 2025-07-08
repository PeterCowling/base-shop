// apps/cms/src/app/[lang]/generateStaticParams.ts
import { LOCALES } from "@acme/i18n";

export default function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
