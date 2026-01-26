// apps/cover-me-pretty/src/app/page.tsx

import { redirect } from "next/navigation";

import { LOCALES } from "@acme/i18n";

export default function RootPage() {
  const defaultLocale = LOCALES[0] ?? "en";
  redirect(`/${defaultLocale}`);
}

