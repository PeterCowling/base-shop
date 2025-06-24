// apps/cms/src/app/(cms)/shop/[shop]/settings/page.tsx

import { readSettings } from "@platform-core/repositories/json";
import type { Locale } from "@types";

export const revalidate = 0;

export default async function SettingsPage({
  params,
}: {
  params: { shop: string };
}) {
  const { shop } = params;
  const settings = await readSettings(shop);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Settings – {shop}</h2>
      <h3 className="mt-4 font-medium">Languages</h3>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {settings.languages.map((l: Locale) => (
          <li key={l}>{l.toUpperCase()}</li>
        ))}
      </ul>
    </div>
  );
}
