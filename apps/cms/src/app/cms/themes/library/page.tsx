// apps/cms/src/app/cms/themes/library/page.tsx
import Link from "next/link";
import type { ThemeLibraryEntry } from "@acme/types/theme/ThemeLibrary";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations";

async function fetchThemes(): Promise<ThemeLibraryEntry[]> {
  const res = await fetch("/cms/api/themes", { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as ThemeLibraryEntry[];
}

export default async function ThemeLibraryPage() {
  const t = await getTranslations("en");
  const themes = await fetchThemes();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">{t("cms.theme.library")}</h2>
      <ul>
        {themes.map((tItem) => (
          <li key={tItem.id} className="mb-2">
            {tItem.name}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link href="/cms">{t("wizard.back")}</Link>
      </p>
    </div>
  );
}
