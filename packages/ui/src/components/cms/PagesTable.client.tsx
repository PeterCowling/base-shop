// packages/ui/components/cms/PagesTable.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { Page } from "@acme/types";
import DataTable, { type Column } from "./DataTable";
import { Card, CardContent, Input } from "../atoms/shadcn";
import { Tag } from "../atoms";
import { cn } from "@ui/utils/style";
import { useTranslations } from "@acme/i18n";

// Use shared translations hook; defaults to English in tests/storybook
// and resolves known keys like cms.pages.* to human-readable labels.

interface Props {
  shop: string;
  pages: Page[];
  canWrite?: boolean;
}

export default function PagesTable({ shop, pages, canWrite = false }: Props) {
  const t = useTranslations();
  // Provide readable fallbacks when translations aren't loaded in tests/storybook
  const tt = (key: string, fallback: string): string => {
    const value = t(key);
    return value === key ? fallback : value;
  };
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
      header: t("Slug"),
      render: (p: Page) => {
        const rawTitle = (p as unknown as { title?: unknown }).title;
        const pageTitle = typeof rawTitle === "string" ? rawTitle : t("Untitled");
        return (
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span aria-hidden className="text-muted-foreground">/</span>
              <span className="font-medium text-foreground">{p.slug || tt("cms.pages.slug.missing", "(no slug)")}</span>
            </div>
            <p className="text-xs text-muted-foreground">{pageTitle}</p>
          </div>
        );
      },
    },
    {
      header: tt("cms.pages.column.status", "Status"),
      width: "8rem",
      render: (p: Page) => {
        const rawStatus = (p as unknown as { status?: unknown }).status;
        const normalized = typeof rawStatus === "string" ? rawStatus : "";
        const label = normalized || t("common.unknown");
        // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        const variantClasses = normalized === "published"
          ? "bg-success-soft text-foreground" /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */
          : normalized === "draft"
            ? "bg-warning-soft text-foreground" /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */
            : normalized === "archived"
              ? "bg-muted text-foreground" /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */
              : "bg-surface-2 text-foreground"; /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */
        // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        const tagBaseClasses = "rounded-lg px-2 py-1 text-xs";
        return (
          <Tag className={cn(tagBaseClasses, variantClasses)}>
            {label}
          </Tag>
        );
      },
    },
  ];

  if (canWrite) {
    columns.push({
      header: tt("cms.pages.column.actions", "Actions"),
      width: "6rem",
      render: (p: Page) => (
        <Link
          href={`/cms/shop/${shop}/pages/${p.slug || p.id}/builder`}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border/30 px-3 text-xs text-foreground hover:bg-surface-2" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        >
          {tt("cms.pages.actions.edit", "Edit")}
        </Link>
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canWrite && (
          <div className="flex items-center gap-2">
            <Link
              href={`/cms/shop/${shop}/pages/new/builder`}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-success px-4 text-sm font-semibold text-success-foreground shadow-elevation-3 hover:brightness-110"
            >
              {t("New Page")}
            </Link>
            <Link
              href={`/cms/shop/${shop}/pages/new/componenteditor`}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border/30 px-4 text-sm font-semibold text-foreground hover:bg-surface-2"
            >
              {t("Component editor")}
            </Link>
          </div>
        )}
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("Search pages by slug, title, or status…")}
          aria-label={t("Search pages")}
          className="h-10 w-full sm:w-64 rounded-lg border-border/20 bg-input text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring focus-visible:ring-offset-2"
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
