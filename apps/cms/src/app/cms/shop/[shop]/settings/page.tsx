// apps/cms/src/app/cms/shop/[shop]/settings/page.tsx

import { readSettings, readShop } from "@platform-core/repositories/json";
import type { Locale } from "@types";
import dynamic from "next/dynamic";

const ShopEditor = dynamic(() => import("./ShopEditor"));

export const revalidate = 0;

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  const [settings, info] = await Promise.all([
    readSettings(shop),
    readShop(shop),
  ]);

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Settings – {shop}</h2>
      <h3 className="mt-4 font-medium">Languages</h3>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {settings.languages.map((l: Locale) => (
          <li key={l}>{l.toUpperCase()}</li>
        ))}
      </ul>
    </div>
  );
}
