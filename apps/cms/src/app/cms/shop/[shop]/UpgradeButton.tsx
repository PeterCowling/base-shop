// apps/cms/src/app/cms/shop/[shop]/UpgradeButton.tsx
"use client";

import { useMemo, useState } from "react";

import { Toast } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";
import { Button, Card, CardContent } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ open: false, message: "" });

  const closeToast = () => setToast((state) => ({ ...state, open: false }));

  const ctaCopy = useMemo(
    () => ({
      title: String(t("cms.upgrade.prepare.title")),
      description: String(t("cms.upgrade.prepare.desc")),
      success: String(t("cms.upgrade.prepare.success")),
      failure: String(t("cms.upgrade.prepare.failed")),
    }),
    [t]
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
      // i18n-exempt -- LOG-1001 [ttl=2026-12-31] console log only, not user-facing copy
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
          <Inline wrap gap={3}>
            <Button
              type="button"
              onClick={handleClick}
              disabled={loading}
              className="min-w-52"
            >
              {loading ? t("cms.upgrade.preparing") : t("cms.upgrade.previewCta")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() =>
                setToast({
                  open: true,
                  message: String(t("cms.upgrade.stepsBackground")),
                })
              }
            >
              {t("cms.upgrade.viewSteps")}
            </Button>
          </Inline>
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
