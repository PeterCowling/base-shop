"use client";

import { useCallback, useMemo, useState } from "react";
import { Toast } from "@ui/components/atoms";
import type { ActionResult, ActionStatus } from "../components/actionResult";
import SegmentDesigner, {
  type SegmentDesignerProps,
} from "../marketing/components/SegmentDesigner";

type ToastState = { open: boolean; status: ActionStatus; message: string };

const defaultToast: ToastState = { open: false, status: "success", message: "" };

export default function SegmentBuilder() {
  const [toast, setToast] = useState<ToastState>(defaultToast);

  const showToast = useCallback((result: ActionResult) => {
    setToast({ open: true, status: result.status, message: result.message });
  }, []);

  const closeToast = useCallback(() => {
    setToast((current) => ({ ...current, open: false }));
  }, []);

  const toastClassName = useMemo(() => {
    return toast.status === "error"
      ? "bg-destructive text-destructive-foreground"
      : "bg-success text-success-fg";
  }, [toast.status]);

  const saveSegment = useCallback<SegmentDesignerProps["saveSegment"]>(async (payload) => {
    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return { status: "success", message: "Segment saved." } satisfies ActionResult;
      }
      let message = "Unable to save segment.";
      try {
        const json = (await res.json()) as { error?: string };
        if (json.error) message = json.error;
      } catch {}
      return { status: "error", message } satisfies ActionResult;
    } catch (error) {
      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Network error while saving segment.",
      } satisfies ActionResult;
    }
  }, []);

  return (
    <div className="space-y-6 p-6">
      <SegmentDesigner saveSegment={saveSegment} onNotify={showToast} />
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={closeToast}
        className={toastClassName}
        role="status"
      />
    </div>
  );
}
