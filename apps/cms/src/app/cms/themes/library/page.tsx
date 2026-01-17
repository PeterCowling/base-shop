// apps/cms/src/app/cms/themes/library/page.tsx
import Link from "next/link";
import { headers } from "next/headers";
import { track } from "@acme/telemetry";
import type { ThemeLibraryEntry } from "@acme/types/theme/ThemeLibrary";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";

async function fetchThemes(origin: string): Promise<ThemeLibraryEntry[]> {
  const url = new URL("/api/themes", origin).toString();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as ThemeLibraryEntry[];
}

export default async function ThemeLibraryPage() {
  track("themes:library:view", {});
  const t = await getTranslations("en");

  // Derive an absolute origin for server-side fetches while keeping tests simple.
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const origin =
    process.env.NODE_ENV === "test" || !host
      ? "http://localhost:3006"
      : `${proto}://${host}`;

  const themes = await fetchThemes(origin);
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
        <Link href="/cms">{t("cms.back")}</Link>
      </p>
    </div>
  );
}
