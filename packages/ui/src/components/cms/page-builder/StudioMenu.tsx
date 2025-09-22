"use client";

import React from "react";
import { Popover, PopoverTrigger, PopoverContent, Tooltip } from "../../atoms";
import { Button } from "../../atoms/shadcn";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default function StudioMenu({ shop }: { shop?: string | null }) {
  const siteHref = shop ? `/cms/shop/${shop}` : "/cms`";
  return (
    <Popover>
      <Tooltip text="Project menu">
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Project menu" className="h-8 w-8">
            <HamburgerMenuIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent align="start" className="w-64 text-sm">
        <div className="flex flex-col gap-1">
          <Link className="rounded px-2 py-1 hover:bg-muted" href="/cms">Dashboard</Link>
          {shop && <Link className="rounded px-2 py-1 hover:bg-muted" href={`/cms/shop/${shop}`}>Site</Link>}
          {shop && <Link className="rounded px-2 py-1 hover:bg-muted" href={`/cms/shop/${shop}/settings`}>Tools</Link>}
          <button type="button" className="rounded px-2 py-1 text-left hover:bg-muted" onClick={() => { try { window.dispatchEvent(new Event("pb:open-view")); } catch {} }}>View…</button>
          <Link className="rounded px-2 py-1 hover:bg-muted" href="/cms/shop">My Sites</Link>
          <hr className="my-1" />
          <Link className="rounded bg-primary px-2 py-1 text-primary-foreground hover:opacity-90" href="/cms/upgrade">Upgrade</Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

