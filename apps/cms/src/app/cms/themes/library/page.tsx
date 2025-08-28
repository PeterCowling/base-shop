// apps/cms/src/app/cms/themes/library/page.tsx
import Link from "next/link";
import type { ThemeLibraryEntry } from "@acme/types/theme/ThemeLibrary";
import { useTranslations } from "@i18n/useTranslations.server";

async function fetchThemes(): Promise<ThemeLibraryEntry[]> {
  const res = await fetch("/cms/api/themes", { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as ThemeLibraryEntry[];
}

export default async function ThemeLibraryPage() {
  const t = await useTranslations("en");
  const themes = await fetchThemes();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">{t("cms.theme.library")}</h2>
      <ul>
        {themes.map((t) => (
          <li key={t.id} className="mb-2">
            {t.name}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link href="/cms">{t("wizard.back")}</Link>
      </p>
    </div>
  );
}
