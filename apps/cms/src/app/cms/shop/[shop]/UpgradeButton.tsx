// apps/cms/src/app/cms/shop/[shop]/UpgradeButton.tsx
"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardContent, Toast } from "@ui/components/atoms";

type ToastState = {
  open: boolean;
  message: string;
};

function parseErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data !== null && "error" in data) {
    const { error } = data as { error?: unknown };
    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }
  }
  return fallback;
}

export default function UpgradeButton({ shop }: { shop: string }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ open: false, message: "" });

  const closeToast = () => setToast((state) => ({ ...state, open: false }));

  const ctaCopy = useMemo(
    () => ({
      title: "Prepare an upgrade preview",
      description:
        "Generate a side-by-side preview of the latest components before promoting them live.",
      success: "Upgrade ready! Redirecting to preview…",
      failure: "Upgrade failed",
    }),
    []
  );

  async function handleClick() {
    setLoading(true);
    setToast((state) => ({ ...state, open: false }));
    try {
      const res = await fetch("/api/upgrade-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop }),
      });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => ({}));
        throw new Error(parseErrorMessage(data, ctaCopy.failure));
      }

      setToast({ open: true, message: ctaCopy.success });
      window.location.href = `/cms/shop/${shop}/upgrade-preview`;
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : ctaCopy.failure;
      console.error("Upgrade failed", err);
      setToast({ open: true, message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="h-full">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{ctaCopy.title}</h3>
            <p className="text-muted-foreground text-sm">{ctaCopy.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleClick}
              disabled={loading}
              className="min-w-[200px]"
            >
              {loading ? "Preparing preview…" : "Upgrade & preview"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() =>
                setToast({
                  open: true,
                  message: "Upgrade steps will run in the background once started.",
                })
              }
            >
              View upgrade steps
            </Button>
          </div>
        </CardContent>
      </Card>
      <Toast
        open={toast.open}
        onClose={closeToast}
        message={toast.message}
        role="status"
        aria-live="polite"
      />
    </>
  );
}

