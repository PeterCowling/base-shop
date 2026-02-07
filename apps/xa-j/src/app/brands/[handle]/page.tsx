import { redirect } from "next/navigation";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  redirect(`/designer/${handle}`);
}
