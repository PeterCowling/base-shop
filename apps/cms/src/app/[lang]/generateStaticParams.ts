// apps/cms/src/app/[lang]/generateStaticParams.ts
import { LOCALES } from "@types";

export default function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
