"use client";

import { useCallback } from "react";

import { useToast } from "@acme/ui/operations";

import type { ActionResult } from "../../components/actionResult";
import DiscountManager, {
  type Discount,
  type DiscountManagerProps,
} from "../components/DiscountManager";

export default function DiscountsPage() {
  const toast = useToast();

  const showToast = useCallback((result: ActionResult) => {
    if (result.status === "error") {
      toast.error(result.message);
    } else {
      toast.success(result.message);
    }
  }, [toast]);

  const loadDiscounts = useCallback<DiscountManagerProps["loadDiscounts"]>(async () => {
    const res = await fetch("/api/marketing/discounts");
    if (!res.ok) {
      throw new Error("Failed to load discounts");
    }
    const data = (await res.json()) as Discount[];
    return data;
  }, []);

  const createDiscount = useCallback<DiscountManagerProps["createDiscount"]>(
    async (payload) => {
      try {
        const res = await fetch("/api/marketing/discounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          return { status: "success", message: "Discount saved." } satisfies ActionResult;
        }
        let message = "Unable to save discount.";
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
              : "Network error while saving discount.",
        } satisfies ActionResult;
      }
    },
    [],
  );

  const toggleDiscount = useCallback<DiscountManagerProps["toggleDiscount"]>(
    async (code, active) => {
      try {
        const res = await fetch("/api/marketing/discounts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, active }),
        });
        if (res.ok) {
          return {
            status: "success",
            message: active ? "Discount activated." : "Discount paused.",
          } satisfies ActionResult;
        }
        let message = "Unable to update discount.";
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
              : "Network error while updating discount.",
        } satisfies ActionResult;
      }
    },
    [],
  );

  const deleteDiscount = useCallback<DiscountManagerProps["deleteDiscount"]>(
    async (code) => {
      try {
        const res = await fetch(`/api/marketing/discounts?code=${encodeURIComponent(code)}`, {
          method: "DELETE",
        });
        if (res.ok) {
          return { status: "success", message: "Discount deleted." } satisfies ActionResult;
        }
        let message = "Unable to delete discount.";
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
              : "Network error while deleting discount.",
        } satisfies ActionResult;
      }
    },
    [],
  );

  return (
    <div className="space-y-6 p-6">
      <DiscountManager
        loadDiscounts={loadDiscounts}
        createDiscount={createDiscount}
        toggleDiscount={toggleDiscount}
        deleteDiscount={deleteDiscount}
        onNotify={showToast}
      />
    </div>
  );
}
