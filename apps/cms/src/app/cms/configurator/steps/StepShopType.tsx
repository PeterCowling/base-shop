"use client";

import { CheckIcon } from "@radix-ui/react-icons";

import { Cluster } from "@acme/design-system/primitives";
import { Button } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";

import type { ConfiguratorStepProps } from "@/types/configurator";

import { useConfigurator } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";

export default function StepShopType({ prevStepId, nextStepId }: ConfiguratorStepProps): React.JSX.Element {
  const { state, update } = useConfigurator();
  const [, markComplete] = useStepCompletion("shop-type");
  const t = useTranslations();

  const current = state.type ?? "sale";

  const Option = ({ value, label, description }: { value: "sale" | "rental"; label: string; description: string }) => {
    const selected = current === value;
    return (
      <button
        type="button"
        onClick={() => update("type", value)}
        aria-pressed={selected}
        className={
          // i18n-exempt -- CMS-1234 [ttl=2026-01-31]
          "w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
          // i18n-exempt -- CMS-1234 [ttl=2026-01-31]
          (selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-foreground">{label}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
          <span
            className={
              // i18n-exempt -- CMS-1234 [ttl=2026-01-31]
              "grid size-6 place-content-center rounded-full border text-xs " +
              // i18n-exempt -- CMS-1234 [ttl=2026-01-31]
              (selected ? "border-primary bg-primary text-primary-fg" : "border-border bg-background")
            }
            aria-hidden
          >
            {selected ? <CheckIcon className="h-4 w-4" aria-hidden /> : null}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("cms.configurator.shopType.help")}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Option
          value="sale"
          label={String(t("cms.configurator.shopType.sale.label"))}
          description={String(t("cms.configurator.shopType.sale.description"))}
        />
        <Option
          value="rental"
          label={String(t("cms.configurator.shopType.rental.label"))}
          description={String(t("cms.configurator.shopType.rental.description"))}
        />
      </div>

      <Cluster justify="between">
        {prevStepId && (
          <Button
            data-cy="back"
            variant="outline"
            onClick={() => (window.location.href = `/cms/configurator/${prevStepId}`)}
          >
            {t("wizard.back")}
          </Button>
        )}
        {nextStepId && (
          <Button
            data-cy="next"
            onClick={() => {
              markComplete(true);
              window.location.href = `/cms/configurator/${nextStepId}`;
            }}
          >
            {t("wizard.next")}
          </Button>
        )}
      </Cluster>
    </div>
  );
}
