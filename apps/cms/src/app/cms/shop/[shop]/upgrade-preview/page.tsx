import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requirePermission } from "@acme/auth";
import { checkShopExists } from "@acme/platform-core/shops";

import UpgradePreviewClient from "./UpgradePreviewClient";

// i18n-exempt: Static SEO title with brand; not user-facing runtime copy
export const metadata: Metadata = {
  title: "Upgrade Preview · Base-Shop", // i18n-exempt: Static SEO title with brand; not user-facing runtime copy
};

export default async function UpgradePreview({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  await requirePermission("manage_pages");
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  return <UpgradePreviewClient shop={shop} />;
}
