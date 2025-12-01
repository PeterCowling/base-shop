import { notFound } from "next/navigation";
import { pageSchema, type Page, type PageComponent } from "@acme/page-builder-core";
import type { Locale } from "@i18n/locales";
import { devicePresets, getLegacyPreset } from "@ui/utils/devicePresets";
import { exportComponents } from "@acme/page-builder-core";
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
    // i18n-exempt -- ABC-123 server-only status text; not user-visible [ttl=2025-06-30]
    return new Response("Unauthorized", { status: 401 });
  }
  if (!res.ok) {
    // i18n-exempt -- ABC-123 developer exception message; surfaced to logs/error boundary [ttl=2025-06-30]
    throw new Error("Failed to load preview");
  }
  const page: Page = pageSchema.parse(await res.json());
  const editor = page.history?.editor;
  const components = exportComponents(page.components as PageComponent[], editor) as PageComponent[];
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
      editor={editor}
    />
  );
}
