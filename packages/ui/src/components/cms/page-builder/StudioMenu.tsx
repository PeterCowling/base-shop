"use client";

import React from "react";
import Link from "next/link";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";

import { Popover, PopoverContent, PopoverTrigger, Tooltip } from "../../atoms";
import { Button } from "../../atoms/shadcn";

export default function StudioMenu({ shop }: { shop?: string | null }) {
  // i18n-exempt — Editor navigation labels; not part of the storefront
  /* i18n-exempt */ const t = (s: string) => s;
  // Render popover content in a portal to avoid being clipped/obscured
  const container = typeof window !== "undefined" ? document.body : undefined;
  return (
    <Popover>
      <Tooltip text={t("Project menu")}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" aria-label={t("Project menu")} className="h-10 w-10">
            <HamburgerMenuIcon className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent align="start" className="w-64 text-sm" container={container}>
        <div className="flex flex-col gap-1">
          <Link className="rounded px-2 py-1 hover:bg-muted min-h-10" href="/cms">{t("Dashboard")}</Link>
          {shop && <Link className="rounded px-2 py-1 hover:bg-muted min-h-10" href={`/cms/shop/${shop}`}>{t("Site")}</Link>}
          {shop && <Link className="rounded px-2 py-1 hover:bg-muted min-h-10" href={`/cms/shop/${shop}/sections`}>{t("Sections")}</Link>}
          {shop && <Link className="rounded px-2 py-1 hover:bg-muted min-h-10" href={`/cms/shop/${shop}/settings`}>{t("Tools")}</Link>}
          {shop && (
            <Link
              className="rounded px-2 py-1 hover:bg-muted min-h-10"
              href={`/cms/shop/${shop}/marketing/email`}
            >
              {t("Email Campaigns")}
            </Link>
          )}
          <button type="button" className="rounded px-2 py-1 text-start hover:bg-muted min-h-10 min-w-10" onClick={() => { try { window.dispatchEvent(new Event("pb:open-view")); } catch {} }}>{t("View…")}</button>
          <button
            type="button"
            className="rounded px-2 py-1 text-start hover:bg-muted min-h-10 min-w-10"
            onClick={() => { try { window.dispatchEvent(new Event("pb:open-design")); } catch {} }}
          >
            {t("Design…")}
          </button>
          <button
            type="button"
            className="rounded px-2 py-1 text-start hover:bg-muted min-h-10 min-w-10"
            onClick={() => { try { window.dispatchEvent(new Event("pb:open-breakpoints")); } catch {} }}
          >
            {t("Device Manager…")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
