import { redirect } from "next/navigation";

import { LOCALES } from "@acme/i18n/locales";

export default function RootPage() {
  const defaultLocale = LOCALES[0] ?? "en";
  redirect(`/${defaultLocale}`);
}
