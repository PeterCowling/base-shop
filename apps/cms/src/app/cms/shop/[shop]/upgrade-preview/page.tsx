import { checkShopExists } from "@acme/lib";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@auth";
import UpgradePreviewClient from "./UpgradePreviewClient";

export const metadata: Metadata = {
  title: "Upgrade Preview · Base-Shop",
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
