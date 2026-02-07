import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { checkShopExists } from "@acme/platform-core/shops";

import EditPreviewPage from "./EditPreviewPage";

export const metadata: Metadata = {
  title: "Edit Preview · Base-Shop",
};

export default async function EditPreview({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  return <EditPreviewPage shop={shop} />;
}
