import { notFound } from "next/navigation";
import { pageSchema, type PageComponent } from "@acme/types";
import type { Locale } from "@i18n/locales";
import { devicePresets, getLegacyPreset } from "@ui/utils/devicePresets";
import PreviewClient from "./PreviewClient";

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: { pageId: string };
  searchParams: { token?: string; upgrade?: string; device?: string; view?: string };
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
  const components = page.components as PageComponent[];
  const editor = page.history?.editor;
  const locale = (Object.keys(page.seo.title)[0] || "en") as Locale;
  const init = searchParams.device ?? searchParams.view;
  const initialDeviceId = (() => {
    if (typeof init === "string") {
      if (["desktop", "tablet", "mobile"].includes(init)) {
        return getLegacyPreset(init as "desktop" | "tablet" | "mobile").id;
      }
      const match = devicePresets.find((p) => p.id === init);
      if (match) return match.id;
    }
    return devicePresets[0].id;
  })();

  return (
    <PreviewClient
      components={components}
      locale={locale}
      initialDeviceId={initialDeviceId}
      editor={editor as any}
    />
  );
}
