"use client";
import type { ChangeEvent } from "react";

import type { PricingTableComponent } from "@acme/types";

import { Button, Input, Textarea } from "../../atoms/shadcn";

import type { EditorProps } from "./EditorProps";

type Props = EditorProps<PricingTableComponent>;

export default function PricingTableEditor({ component, onChange }: Props) {
  // i18n-exempt — internal editor labels; not displayed to end users
  /* i18n-exempt */
  const t = (s: string) => s;
  type Plan = NonNullable<PricingTableComponent["plans"]>[number];
  const plans: Plan[] = component.plans ?? [];
  const min = component.minItems ?? 0;
  const max = component.maxItems ?? Infinity;

  const update = (idx: number, field: string, value: unknown) => {
    const next = [...plans];
    next[idx] = { ...next[idx], [field]: value };
    onChange({ plans: next } as Partial<PricingTableComponent>);
  };

  const removePlan = (idx: number) => {
    onChange({
      plans: plans.filter((_plan: Plan, i: number) => i !== idx),
    } as Partial<PricingTableComponent>);
  };

  const addPlan = () => {
    onChange({
      plans: [
        ...plans,
        { title: "", price: "", features: [], ctaLabel: "", ctaHref: "" },
      ],
    } as Partial<PricingTableComponent>);
  };

  return (
    <div className="space-y-2">
      {plans.map((plan: Plan, i: number) => (
        // eslint-disable-next-line react/no-array-index-key -- LINT-1002: plans have no stable id in schema; index is acceptable for editor-only list
        <div key={i} className="space-y-1 rounded border p-2">
          <Input
            value={plan.title ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              update(i, "title", e.target.value)
            }
            placeholder={t("title")}
            className="w-full"
          />
          <Input
            value={plan.price ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              update(i, "price", e.target.value)
            }
            placeholder={t("price")}
            className="w-full"
          />
          <Textarea
            value={(plan.features ?? []).join("\n")}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              update(
                i,
                "features",
                e.target.value
                  .split(/\n+/)
                  .map((f) => f.trim())
                  .filter(Boolean)
              )
            }
            placeholder={t("one feature per line")}
            className="w-full"
          />
          <Input
            value={plan.ctaLabel ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              update(i, "ctaLabel", e.target.value)
            }
            placeholder={t("CTA label")}
            className="w-full"
          />
          <Input
            value={plan.ctaHref ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              update(i, "ctaHref", e.target.value)
            }
            placeholder={t("CTA href")}
            className="w-full"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm">{t("Featured")}</label>
            <input
              type="checkbox"
              checked={plan.featured ?? false}
              onChange={(e) => update(i, "featured", e.target.checked)}
            />
          </div>
          <Button
            variant="destructive"
            onClick={() => removePlan(i)}
            disabled={plans.length <= min}
          >
            {t("Remove Plan")}
          </Button>
        </div>
      ))}
      <Button onClick={addPlan} disabled={plans.length >= max}>
        {t("Add Plan")}
      </Button>
    </div>
  );
}
