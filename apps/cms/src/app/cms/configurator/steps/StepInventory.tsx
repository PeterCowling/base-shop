"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Cluster } from "@acme/design-system/primitives/Cluster";
import { useTranslations } from "@acme/i18n";

import { Switch, Toast } from "@/components/atoms";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/shadcn";

import { useConfigurator } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";

export default function StepInventory({ prevStepId, nextStepId }: { prevStepId?: string; nextStepId?: string }) {
  const { state, update } = useConfigurator();
  const t = useTranslations();
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [, markComplete] = useStepCompletion("inventory");
  const router = useRouter();

  const tracking = state.inventoryTracking ?? true;
  const threshold = state.lowStockThreshold ?? 5;
  const backorders = (state.backorderPolicy as string) ?? "deny";
  const location = state.defaultStockLocation ?? "main";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t("cms.inventory.title")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-medium">{t("cms.inventory.track")}</div>
          <div className="flex items-center gap-3">
            <Switch
              checked={tracking}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("inventoryTracking", e.target.checked)}
              aria-label={t("cms.inventory.toggleAria") as string}
            />
            <span className="text-sm text-muted-foreground">{t("cms.inventory.enableTrackingHelp")}</span>
          </div>
        </div>

        <label className="space-y-2">
          <div className="text-sm font-medium">{t("cms.inventory.defaultLocation")}</div>
          <Input
            value={location}
            placeholder={t("cms.inventory.defaultLocation.placeholder") as string}
            onChange={(e) => update("defaultStockLocation", e.target.value)}
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium">{t("cms.inventory.lowStockThreshold")}</div>
          <Input
            type="number"
            min={0}
            value={threshold}
            onChange={(e) => update("lowStockThreshold", Math.max(0, Number(e.target.value || 0)))}
          />
        </label>

        <div className="space-y-2">
          <div className="text-sm font-medium">{t("cms.inventory.backorderPolicy")}</div>
          <Select value={backorders} onValueChange={(v: "deny" | "notify" | "allow") => update("backorderPolicy", v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("cms.inventory.selectPolicy") as string} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deny">{t("cms.inventory.policy.deny")}</SelectItem>
              <SelectItem value="notify">{t("cms.inventory.policy.notify")}</SelectItem>
              <SelectItem value="allow">{t("cms.inventory.policy.allow")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Cluster justify="between">
        {prevStepId && (
          <Button data-cy="back" variant="outline" onClick={() => router.push(`/cms/configurator/${prevStepId}`)}>
            {t("cms.back")}
          </Button>
        )}
        <Button
          data-cy="save-return"
          onClick={() => {
            markComplete(true);
            setToast({ open: true, message: String(t("cms.inventory.saved")) });
            router.push("/cms/configurator");
          }}
        >
          {t("cms.configurator.actions.saveReturn")}
        </Button>
        {nextStepId && (
          <Button data-cy="next" onClick={() => {
            markComplete(true);
            router.push(`/cms/configurator/${nextStepId}`);
          }}>{t("wizard.next")}</Button>
        )}
      </Cluster>

      <Toast open={toast.open} onClose={() => setToast((t) => ({ ...t, open: false }))} message={toast.message} />
    </div>
  );
}
