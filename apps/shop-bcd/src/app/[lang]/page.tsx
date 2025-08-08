import ClientPage from "./page.client";
import { getPages } from "@platform-core/repositories/pages/index.server";

export default async function Home() {
  const pages = await getPages("bcd");
  const page = pages.find((p) => p.slug === "");
  return <ClientPage components={page?.components ?? []} />;
}
