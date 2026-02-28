import { redirect } from "next/navigation";

import { XA_BRANDS } from "../../../lib/demoData";

export function generateStaticParams() {
  return XA_BRANDS.map((b) => ({ handle: b.handle }));
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  redirect(`/designer/${handle}`);
}
