import type { PageComponent } from "@types";
import { promises as fs } from "node:fs";
import path from "node:path";
import shop from "../../../shop.json";
import Home from "./page.client";
import { Locale, resolveLocale } from "@/i18n/locales";

async function loadComponents(): Promise<PageComponent[]> {
  try {
    const file = path.join(
      process.cwd(),
      "..",
      "..",
      "data",
      "shops",
      shop.id,
      "pages",
      "home.json"
    );
    const json = await fs.readFile(file, "utf8");
    const data = JSON.parse(json);
    return Array.isArray(data) ? (data as PageComponent[]) : (data.components ?? []);
  } catch {
    return [];
  }
}

export default async function Page({
  params,
}: {
  params: { lang?: string };
}) {
  const components = await loadComponents();
  const locale: Locale = resolveLocale(params.lang);
  return <Home components={components} locale={locale} />;
}
