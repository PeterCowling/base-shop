// apps/cms/src/app/cms/media/page.tsx
import { redirect } from "next/navigation";
import { listShops } from "../listShops";

export default async function MediaIndexPage() {
  const shops = await listShops();
  if (shops.length > 0) {
    redirect(`/cms/shop/${shops[0]}/media`);
  }
  return <p>No shops found.</p>;
}
