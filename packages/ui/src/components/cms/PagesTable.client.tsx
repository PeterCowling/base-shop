// packages/ui/components/cms/PagesTable.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { Page } from "@acme/types";
import DataTable, { type Column } from "./DataTable";
import { Button, Card, CardContent, Input } from "../atoms/shadcn";
import { Tag } from "../atoms";
import { cn } from "@ui/utils/style";

interface Props {
  shop: string;
  pages: Page[];
  canWrite?: boolean;
}

export default function PagesTable({ shop, pages, canWrite = false }: Props) {
  const [search, setSearch] = useState<string>("");
  const normalisedQuery = useMemo(() => search.trim().toLowerCase(), [search]);

  const filteredPages = useMemo(() => {
    if (!normalisedQuery) return pages;

    return pages.filter((page) => {
      const slug = typeof page.slug === "string" ? page.slug.toLowerCase() : "";
      const legacyTitle = (page as unknown as { title?: unknown }).title;
      const titleFromLegacy = typeof legacyTitle === "string" ? legacyTitle.toLowerCase() : "";
      const status = (page as unknown as { status?: unknown }).status;
      const statusLabel = typeof status === "string" ? status.toLowerCase() : "";

      const seoMatches = Object.values(page.seo?.title ?? {})
        .filter((value): value is string => typeof value === "string")
        .some((value) => value.toLowerCase().includes(normalisedQuery));

      return (
        slug.includes(normalisedQuery) ||
        titleFromLegacy.includes(normalisedQuery) ||
        seoMatches ||
        statusLabel.includes(normalisedQuery)
      );
    });
  }, [pages, normalisedQuery]);

  const columns: Column<Page>[] = [
    {
      header: "Slug",
      render: (p: Page) => {
        const rawTitle = (p as unknown as { title?: unknown }).title;
        const pageTitle = typeof rawTitle === "string" ? rawTitle : "Untitled";
        return (
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span aria-hidden className="text-muted-foreground">/</span>
              <span className="font-medium text-foreground">{p.slug || "(no slug)"}</span>
            </div>
            <p className="text-xs text-muted-foreground">{pageTitle}</p>
          </div>
        );
      },
    },
    {
      header: "Status",
      width: "8rem",
      render: (p: Page) => {
        const rawStatus = (p as unknown as { status?: unknown }).status;
        const normalized = typeof rawStatus === "string" ? rawStatus : "";
        const label = normalized || "unknown";
        const variantClasses = normalized === "published"
          ? "bg-success-soft text-foreground"
          : normalized === "draft"
            ? "bg-warning-soft text-foreground"
            : normalized === "archived"
              ? "bg-muted text-foreground"
              : "bg-surface-2 text-foreground";
        return (
          <Tag className={cn("rounded-lg px-2 py-1 text-xs", variantClasses)}>
            {label}
          </Tag>
        );
      },
    },
  ];

  if (canWrite) {
    columns.push({
      header: "Actions",
      width: "6rem",
      render: (p: Page) => (
        <Button
          asChild
          variant="outline"
          className="h-8 rounded-lg border-border/30 px-3 text-xs text-foreground hover:bg-surface-2"
        >
          <Link href={`/cms/shop/${shop}/pages/${p.slug || p.id}/builder`}>
            Edit
          </Link>
        </Button>
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canWrite && (
          <Button
            asChild
            className="h-10 rounded-xl bg-success px-4 text-sm font-semibold text-success-foreground shadow-elevation-3 hover:brightness-110"
          >
            <Link href={`/cms/shop/${shop}/pages/new/builder`}>New Page</Link>
          </Button>
        )}
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search pages by slug, title, or status…"
          aria-label="Search pages"
          className="h-10 w-full max-w-xs rounded-lg border-border/20 bg-input text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring focus-visible:ring-offset-2"
        />
      </div>
      <Card className="border border-border/10 bg-surface-2 text-foreground">
        <CardContent className="px-0 py-0">
          <DataTable rows={filteredPages} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
