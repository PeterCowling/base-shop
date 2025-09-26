"use client";

import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/shadcn";
import { Switch, Toast } from "@/components/atoms";
import { useConfigurator } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StepInventory({ prevStepId, nextStepId }: { prevStepId?: string; nextStepId?: string }) {
  const { state, update } = useConfigurator();
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [, markComplete] = useStepCompletion("inventory");
  const router = useRouter();

  const tracking = state.inventoryTracking ?? true;
  const threshold = state.lowStockThreshold ?? 5;
  const backorders = (state.backorderPolicy as string) ?? "deny";
  const location = state.defaultStockLocation ?? "main";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Inventory</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-medium">Track Inventory</div>
          <div className="flex items-center gap-3">
            <Switch
              checked={tracking}
              onChange={(e) => update("inventoryTracking" as any, (e.target as HTMLInputElement).checked)}
              aria-label="Toggle inventory tracking"
            />
            <span className="text-sm text-muted-foreground">Enable stock tracking for SKUs</span>
          </div>
        </div>

        <label className="space-y-2">
          <div className="text-sm font-medium">Default Stock Location</div>
          <Input
            value={location}
            placeholder="main"
            onChange={(e) => update("defaultStockLocation" as any, e.target.value)}
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium">Low Stock Threshold</div>
          <Input
            type="number"
            min={0}
            value={threshold}
            onChange={(e) => update("lowStockThreshold" as any, Math.max(0, Number(e.target.value || 0)))}
          />
        </label>

        <div className="space-y-2">
          <div className="text-sm font-medium">Backorder Policy</div>
          <Select value={backorders} onValueChange={(v) => update("backorderPolicy" as any, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select policy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deny">Deny backorders</SelectItem>
              <SelectItem value="notify">Allow with warning</SelectItem>
              <SelectItem value="allow">Allow backorders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between">
        {prevStepId && (
          <Button data-cy="back" variant="outline" onClick={() => router.push(`/cms/configurator/${prevStepId}`)}>
            Back
          </Button>
        )}
        <Button
          data-cy="save-return"
          onClick={() => {
            markComplete(true);
            setToast({ open: true, message: "Inventory settings saved" });
            router.push("/cms/configurator");
          }}
        >
          Save & return
        </Button>
        {nextStepId && (
          <Button data-cy="next" onClick={() => {
            markComplete(true);
            router.push(`/cms/configurator/${nextStepId}`);
          }}>Next</Button>
        )}
      </div>

      <Toast open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} message={toast.message} />
    </div>
  );
}

