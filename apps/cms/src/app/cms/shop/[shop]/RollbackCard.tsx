"use client";

import { useState } from "react";
import { Button, Card, CardContent, Toast } from "@acme/ui/components/atoms";
import { useTranslations } from "@acme/i18n";

interface RollbackCardProps {
  shop: string;
}

type ToastState = {
  open: boolean;
  message: string;
};

function extractErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data !== null && "error" in data) {
    const { error } = data as { error?: unknown };
    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }
  }

  return fallback;
}

export default function RollbackCard({ shop }: RollbackCardProps) {
  const t = useTranslations();
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>({ open: false, message: "" });

  const closeToast = () => setToast((state) => ({ ...state, open: false }));

  async function handleRollback() {
    setSubmitting(true);
    setToast((state) => ({ ...state, open: false }));
    try {
      const res = await fetch(`/api/shop/${shop}/rollback`, { method: "POST" });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => ({}));
        throw new Error(extractErrorMessage(data, t("cms.rollback.error") as string));
      }

      setToast({
        open: true,
        message: t("cms.rollback.success") as string,
      });
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : (t("cms.rollback.error") as string);
      console.error(t("cms.rollback.error"), err);
      setToast({ open: true, message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Card className="h-full">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{t("cms.rollback.heading")}</h3>
            <p className="text-muted-foreground text-sm">
              {t("cms.rollback.description")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="min-w-52"
            disabled={submitting}
            onClick={handleRollback}
          >
            {submitting ? t("cms.rollback.cta.loading") : t("cms.rollback.cta.default")}
          </Button>
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
