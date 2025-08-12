import type { ChangeEvent } from "react";
import type { PageComponent } from "@acme/types";
import { Button, Input, Textarea } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function PricingTableEditor({ component, onChange }: Props) {
  const plans = ((component as any).plans ?? []) as any[];
  const min = (component as any).minItems ?? 0;
  const max = (component as any).maxItems ?? Infinity;

  const update = (idx: number, field: string, value: unknown) => {
    const next = [...plans];
    next[idx] = { ...next[idx], [field]: value };
    onChange({ plans: next } as Partial<PageComponent>);
  };

  const removePlan = (idx: number) => {
    onChange({ plans: plans.filter((_, i) => i !== idx) } as Partial<PageComponent>);
  };

  const addPlan = () => {
    onChange({
      plans: [
        ...plans,
        { title: "", price: "", features: [], ctaLabel: "", ctaHref: "" },
      ],
    } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      {plans.map((plan, i) => (
        <div key={i} className="space-y-1 rounded border p-2">
          <Input
            value={plan.title ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              update(i, "title", e.target.value)
            }
            placeholder="title"
            className="w-full"
          />
          <Input
            value={plan.price ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              update(i, "price", e.target.value)
            }
            placeholder="price"
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
            placeholder="one feature per line"
            className="w-full"
          />
          <Input
            value={plan.ctaLabel ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              update(i, "ctaLabel", e.target.value)
            }
            placeholder="CTA label"
            className="w-full"
          />
          <Input
            value={plan.ctaHref ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              update(i, "ctaHref", e.target.value)
            }
            placeholder="CTA href"
            className="w-full"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm">Featured</label>
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
            Remove Plan
          </Button>
        </div>
      ))}
      <Button onClick={addPlan} disabled={plans.length >= max}>
        Add Plan
      </Button>
    </div>
  );
}
