import { notFound } from "next/navigation";
import { pageSchema } from "@acme/types";
import type { Locale } from "@i18n/locales";
import DynamicRenderer from "@ui/components/DynamicRenderer";

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: { pageId: string };
  searchParams: { token?: string; upgrade?: string };
}) {
  const { pageId } = params;
  const query = new URLSearchParams();
  if (searchParams.token) query.set("token", searchParams.token);
  if (searchParams.upgrade) query.set("upgrade", searchParams.upgrade);
  const res = await fetch(`/preview/${pageId}?${query.toString()}`, {
    cache: "no-store",
  });
  if (res.status === 404) {
    notFound();
  }
  if (res.status === 401) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!res.ok) {
    throw new Error("Failed to load preview");
  }
  const page = pageSchema.parse(await res.json());
  const locale = (Object.keys(page.seo.title)[0] || "en") as Locale;
  return <DynamicRenderer components={page.components} locale={locale} />;
}
