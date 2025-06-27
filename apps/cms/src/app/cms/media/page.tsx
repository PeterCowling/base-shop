// apps/cms/src/app/cms/media/page.tsx

import { redirect } from "next/navigation";

export default function MediaRedirectPage() {
  const shop = process.env.NEXT_PUBLIC_DEFAULT_SHOP || "default";
  redirect(`/cms/shop/${shop}/media`);
}
