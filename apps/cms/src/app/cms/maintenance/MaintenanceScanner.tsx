"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Tag } from "@/components/atoms/shadcn";
import { runMaintenanceCheck, type FlaggedItem } from "./scan.server";

interface MaintenanceScannerProps {
  initial: FlaggedItem[];
}

type ToastState = {
  open: boolean;
  message: string;
};

export function MaintenanceScanner({ initial }: MaintenanceScannerProps) {
  const [items, setItems] = useState(initial);
  const [toast, setToast] = useState<ToastState>({ open: false, message: "" });
  const [isPending, startTransition] = useTransition();
  const shouldFocusResults = useRef(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const statusVariant = items.length === 0 ? "success" : "warning";
  const statusLabel = items.length === 0 ? "All clear" : `${items.length} flagged`;

  const summary = useMemo(() => {
    if (items.length === 0) {
      return "No maintenance issues detected in the latest scan.";
    }
    return `${items.length} ${items.length === 1 ? "item" : "items"} require follow-up.`;
  }, [items.length]);

  useEffect(() => {
    if (shouldFocusResults.current && !isPending && resultsRef.current) {
      resultsRef.current.focus({ preventScroll: false });
      shouldFocusResults.current = false;
    }
  }, [isPending]);

  const handleScan = () => {
    shouldFocusResults.current = true;
    startTransition(async () => {
      try {
        const next = await runMaintenanceCheck();
        setItems(next);
        setToast({
          open: true,
          message:
            next.length === 0
              ? "Scan complete. No issues found."
              : `Scan complete. Found ${next.length} ${next.length === 1 ? "issue" : "issues"}.`,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Maintenance scan failed. Try again later.";
        setToast({ open: true, message });
      }
    });
  };

  return (
    <Card className="border border-border/60">
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="min-w-0 text-lg font-semibold text-foreground">Maintenance results</h2>
          <Tag className="shrink-0" variant={statusVariant}>{statusLabel}</Tag>
        </div>
        <p className="text-sm text-muted-foreground">{summary}</p>
        <Button
          type="button"
          className="h-11 px-5 text-sm font-semibold"
          disabled={isPending}
          onClick={handleScan}
        >
          {isPending ? "Scanning…" : "Run scan again"}
        </Button>
        <div
          ref={resultsRef}
          tabIndex={-1}
          className="space-y-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {items.length === 0 ? (
            <Card className="border border-dashed border-border/60 bg-surface-3">
              <CardContent className="p-4 text-sm text-muted-foreground">
                No items currently require maintenance. Run the scan whenever you want an updated view.
              </CardContent>
            </Card>
          ) : (
            items.map((item, index) => (
              <Card key={`${item.shopId}-${item.sku}-${index}`} className="border border-border/60 bg-surface-3">
                <CardContent className="space-y-1 p-4">
                  <p className="text-sm font-semibold text-foreground">{item.shopId}</p>
                  <p className="text-xs text-muted-foreground">
                    SKU {item.sku} – {item.message}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <Toast
          open={toast.open}
          message={toast.message}
          onClose={() => setToast({ open: false, message: "" })}
          role="status"
        />
      </CardContent>
    </Card>
  );
}
