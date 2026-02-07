"use client";
import React from "react";
import Image from "next/image";
import type { CheckedState } from "@radix-ui/react-checkbox";

import { Sidebar } from "@acme/design-system/primitives/Sidebar";
import { Checkbox, Input, Select, SelectContent, SelectItem,SelectTrigger, SelectValue, Textarea } from "@acme/design-system/shadcn";
import useLocalStrings from "@acme/ui/components/cms/page-builder/hooks/useLocalStrings";

import type { PageItem } from "./types";

type PageSettingsProps = { selected: PageItem | null; updateSelected: (patch: Partial<PageItem>) => void };

const PageInfoSection = ({ selected, updateSelected }: PageSettingsProps) => {
  const t = useLocalStrings();
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{t("Page Info")}</h3>
      <div className="grid grid-cols-1 gap-2">
        <label className="text-xs">
          <div className="mb-1">{t("Title")}</div>
          <Input value={selected?.title ?? ""} onChange={(e) => updateSelected({ title: e.target.value })} placeholder={t("Page title")} />
        </label>
        <label className="text-xs">
          <div className="mb-1">{t("Slug")}</div>
          <Input value={selected?.slug ?? ""} onChange={(e) => updateSelected({ slug: e.target.value.replace(/^\//, "") })} placeholder={t("about-us")} />
        </label>
      </div>
    </section>
  );
};

const PermissionsSection = ({ selected, updateSelected }: PageSettingsProps) => {
  const t = useLocalStrings();
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{t("Permissions")}</h3>
      <div className="grid grid-cols-1 gap-2 text-sm">
        <Sidebar sideWidth="w-48" gap={2} className="items-center">
          <div className="text-xs text-muted-foreground">{t("Visibility")}</div>
          <Select value={selected?.visibility ?? "public"} onValueChange={(v) => updateSelected({ visibility: v as PageItem["visibility"] })}>
            <SelectTrigger className="h-8"><SelectValue placeholder={t("Visibility")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public">{t("Public")}</SelectItem>
              <SelectItem value="hidden">{t("Hidden")}</SelectItem>
            </SelectContent>
          </Select>
        </Sidebar>
        <Sidebar sideWidth="w-48" gap={2} className="items-center">
          <div className="text-xs text-muted-foreground">{t("Allowed roles")}</div>
          <Input placeholder={t("e.g. admin, editor (stub)")} />
        </Sidebar>
      </div>
    </section>
  );
};

const SeoBasicsSection = ({ selected, updateSelected }: PageSettingsProps) => {
  const t = useLocalStrings();
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{t("SEO Basics")}</h3>
      <div className="grid grid-cols-1 gap-2">
        <label className="text-xs">
          <div className="mb-1">{t("SEO Title")}</div>
          <Input value={selected?.seo?.title?.en ?? ""} onChange={(e) => updateSelected({ seo: { ...(selected?.seo || {}), title: { ...(selected?.seo?.title || {}), en: e.target.value } } })} placeholder={t("Title for search engines")} />
        </label>
        <label className="text-xs">
          <div className="mb-1">{t("Description")}</div>
          <Textarea value={selected?.seo?.description?.en ?? ""} onChange={(e) => updateSelected({ seo: { ...(selected?.seo || {}), description: { ...(selected?.seo?.description || {}), en: e.target.value } } })} placeholder={t("Brief summary shown in results")} />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <Checkbox checked={!!selected?.seo?.noindex} onCheckedChange={(v: CheckedState) => updateSelected({ seo: { ...(selected?.seo || {}), noindex: !!v } })} />
          <span>{t("Noindex (discourage search engines)")}</span>
        </label>
      </div>
    </section>
  );
};

const SocialShareSection = ({ selected, updateSelected }: PageSettingsProps) => {
  const t = useLocalStrings();
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{t("Social Share")}</h3>
      <div className="grid grid-cols-1 gap-2">
        <label className="text-xs">
          <div className="mb-1">{t("OG Title")}</div>
          <Input value={selected?.seo?.title?.en ?? ""} onChange={(e) => updateSelected({ seo: { ...(selected?.seo || {}), title: { ...(selected?.seo?.title || {}), en: e.target.value } } })} placeholder={t("Title for social cards")} />
        </label>
        <label className="text-xs">
          <div className="mb-1">{t("OG Description")}</div>
          <Textarea value={selected?.seo?.description?.en ?? ""} onChange={(e) => updateSelected({ seo: { ...(selected?.seo || {}), description: { ...(selected?.seo?.description || {}), en: e.target.value } } })} placeholder={t("Description for social cards")} />
        </label>
        <label className="text-xs">
          <div className="mb-1">{t("OG Image URL")}</div>
          <Input value={selected?.seo?.image ?? ""} onChange={(e) => updateSelected({ seo: { ...(selected?.seo || {}), image: e.target.value } })} placeholder={t("https://…/image.jpg")} />
        </label>
        {selected?.seo?.image && (
          <div className="rounded border p-2">
            <div className="mb-1 text-xs text-muted-foreground">{t("Preview")}</div>
            <div className="relative h-32 w-full overflow-hidden rounded">
              <Image src={selected.seo.image} alt={t("OG preview")} fill className="object-cover" sizes="100vw" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export function PageSettings({ selected, updateSelected }: PageSettingsProps) {
  const t = useLocalStrings();
  if (!selected) return <div className="p-3 text-sm text-muted-foreground">{t("Select a page to edit settings.")}</div>;

  return (
    <div className="space-y-4 overflow-auto">
      <PageInfoSection selected={selected} updateSelected={updateSelected} />
      <PermissionsSection selected={selected} updateSelected={updateSelected} />
      <SeoBasicsSection selected={selected} updateSelected={updateSelected} />
      <SocialShareSection selected={selected} updateSelected={updateSelected} />
    </div>
  );
}
