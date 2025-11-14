import { LOCALES } from "@/lib/locales";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
