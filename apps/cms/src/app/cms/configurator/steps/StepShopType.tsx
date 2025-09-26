"use client";

import { Button } from "@ui/components/atoms/shadcn";
import { useConfigurator } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";
import type { ConfiguratorStepProps } from "@/types/configurator";

export default function StepShopType({ prevStepId, nextStepId }: ConfiguratorStepProps): React.JSX.Element {
  const { state, update } = useConfigurator();
  const [, markComplete] = useStepCompletion("shop-type");

  const current = state.type ?? "sale";

  const Option = ({ value, label, description }: { value: "sale" | "rental"; label: string; description: string }) => {
    const selected = current === value;
    return (
      <button
        type="button"
        onClick={() => update("type", value)}
        aria-pressed={selected}
        className={
          "w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
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
              "grid size-6 place-content-center rounded-full border text-xs " +
              (selected ? "border-primary bg-primary text-primary-fg" : "border-border bg-background")
            }
            aria-hidden
          >
            {selected ? "✓" : ""}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose how your shop operates. You can switch later if needed.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Option
          value="sale"
          label="Sale"
          description="Sell products outright with standard checkout and fulfillment."
        />
        <Option
          value="rental"
          label="Rental"
          description="Rent items for set durations, with returns and maintenance."
        />
      </div>

      <div className="flex justify-between">
        {prevStepId && (
          <Button
            data-cy="back"
            variant="outline"
            onClick={() => (window.location.href = `/cms/configurator/${prevStepId}`)}
          >
            Back
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
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

