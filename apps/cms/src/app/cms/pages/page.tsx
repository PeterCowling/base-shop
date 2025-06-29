// apps/cms/src/app/cms/pages/page.tsx
import { redirect } from "next/navigation";
import { listShops } from "../listShops";

export default async function PagesIndexPage() {
  const shops = await listShops();
  if (shops.length > 0) {
    redirect(`/cms/shop/${shops[0]}/pages`);
  }
  return <p>No shops found.</p>;
}
