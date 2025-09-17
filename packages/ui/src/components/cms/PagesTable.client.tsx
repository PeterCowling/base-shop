// packages/ui/components/cms/PagesTable.tsx
"use client";

import Link from "next/link";

import type { Page } from "@acme/types";
import DataTable, { type Column } from "./DataTable";
import { Button, Card, CardContent } from "../atoms/shadcn";
import { Tag } from "../atoms";
import { cn } from "@ui/utils/style";

interface Props {
  shop: string;
  pages: Page[];
  canWrite?: boolean;
}

export default function PagesTable({ shop, pages, canWrite = false }: Props) {
  const columns: Column<Page>[] = [
    {
      header: "Slug",
      render: (p: Page) => {
        const rawTitle = (p as unknown as { title?: unknown }).title;
        const pageTitle = typeof rawTitle === "string" ? rawTitle : "Untitled";
        return (
          <div className="space-y-1">
            <span className="font-medium text-white">/{p.slug}</span>
            <p className="text-xs text-white/60">{pageTitle}</p>
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
          ? "bg-emerald-500/20 text-emerald-100"
          : normalized === "draft"
            ? "bg-amber-500/20 text-amber-100"
            : normalized === "archived"
              ? "bg-slate-500/20 text-slate-200"
              : "bg-white/10 text-white";
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
          className="h-8 rounded-lg border-white/30 px-3 text-xs text-white hover:bg-white/10"
        >
          <Link href={`/cms/shop/${shop}/pages/${p.slug}/builder`}>Edit</Link>
        </Button>
      ),
    });
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <Button
          asChild
          className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
        >
          <Link href={`/cms/shop/${shop}/pages/new/builder`}>Create new page</Link>
        </Button>
      )}
      <Card className="border border-white/10 bg-white/5 text-white">
        <CardContent className="px-0 py-0">
          <DataTable rows={pages} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
