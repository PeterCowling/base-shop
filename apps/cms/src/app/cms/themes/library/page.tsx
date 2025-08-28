// apps/cms/src/app/cms/themes/library/page.tsx
import Link from "next/link";
import { track } from "@acme/telemetry";
import type { ThemeLibraryEntry } from "@acme/types/theme/ThemeLibrary";

async function fetchThemes(): Promise<ThemeLibraryEntry[]> {
  const res = await fetch("/cms/api/themes", { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as ThemeLibraryEntry[];
}

export default async function ThemeLibraryPage() {
  track("themes:library:view", {});
  const themes = await fetchThemes();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Theme Library</h2>
      <ul>
        {themes.map((t) => (
          <li key={t.id} className="mb-2">
            {t.name}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link href="/cms">Back</Link>
      </p>
    </div>
  );
}
