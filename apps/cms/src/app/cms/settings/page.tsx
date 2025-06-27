// apps/cms/src/app/cms/settings/page.tsx

import { redirect } from "next/navigation";

export default function SettingsRedirectPage() {
  const shop = process.env.NEXT_PUBLIC_DEFAULT_SHOP || "default";
  redirect(`/cms/settings/shop/${shop}`);
}
