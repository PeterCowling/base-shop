"use client";

import { useMemo } from "react";

import { useToast } from "@acme/ui/operations";

import { Button, Card, CardContent, Tag } from "@/components/atoms/shadcn";

interface LivePreviewItem {
  shop: string;
  url: string | null;
  error?: string;
}

interface LivePreviewListProps {
  items: LivePreviewItem[];
}

export function LivePreviewList({ items }: LivePreviewListProps) {
  const toast = useToast();

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.shop.localeCompare(b.shop));
  }, [items]);

  const handleOpen = (item: LivePreviewItem) => () => {
    const url = item.url;
    if (url) {
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        toast.warning(`Popup blocked while opening ${item.shop}.`);
      } else {
        toast.success(`${item.shop} opened in a new tab.`);
        opened.opener = null;
      }
    } else {
      const message = item.error
        ? `Cannot open ${item.shop}: ${item.error}`
        : `No preview available for ${item.shop}.`;
      toast.error(message);
    }
  };

  return (
    <div className="space-y-3">
      {sortedItems.map((item) => {
        const hasPreview = Boolean(item.url);
        const statusVariant = hasPreview ? "success" : "warning";
        const statusLabel = hasPreview ? "Preview ready" : "Unavailable";
        return (
          <Card key={item.shop} className="border border-border/60 bg-surface-3">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">{item.shop}</p>
                <p className="text-xs text-foreground">
                  {hasPreview
                    ? "Launch the live preview in a new tab."
                    : item.error || "Preview configuration not detected."}
                </p>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Tag className="shrink-0" variant={statusVariant}>{statusLabel}</Tag>
                <Button
                  type="button"
                  className="h-10 shrink-0 px-4 text-sm font-medium text-primary-foreground"
                  onClick={handleOpen(item)}
                >
                  {hasPreview ? "Open preview" : "View details"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
