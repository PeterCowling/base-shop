// apps/cover-me-pretty/src/app/[lang]/generateStaticParams.ts
import { LOCALES } from "@acme/i18n";

export default function generateStaticParams() {
  /* prerender /en, /de, /it — Next will also serve `/` via default locale */
  return LOCALES.map((lang) => ({ lang }));
}
