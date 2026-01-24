"use client";

import { useCallback } from "react";

import { useToast } from "@acme/ui/operations";

import type { ActionResult } from "../components/actionResult";
import SegmentDesigner, {
  type SegmentDesignerProps,
} from "../marketing/components/SegmentDesigner";

export default function SegmentBuilder() {
  const toast = useToast();

  const showToast = useCallback((result: ActionResult) => {
    if (result.status === "error") {
      toast.error(result.message);
    } else {
      toast.success(result.message);
    }
  }, [toast]);

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
    </div>
  );
}
