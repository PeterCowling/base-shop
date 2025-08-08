import type { PageComponent } from "@types";
import { getPages } from "@platform-core/repositories/pages/index.server";
import shop from "../../../shop.json";
import Home from "./page.client";

async function loadComponents(): Promise<PageComponent[]> {
  const pages = await getPages(shop.id);
  return pages.find((p) => p.slug === "home")?.components ?? [];
}

export default async function Page() {
  const components = await loadComponents();
  return <Home components={components} />;
}
