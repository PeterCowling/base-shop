import { Button } from "../../atoms/shadcn";
import { cn } from "../../../utils/style/cn";

export interface Plan {
  title: string;
  price: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
}

interface Props {
  plans?: Plan[];
  minItems?: number;
  maxItems?: number;
}

export default function PricingTable({
  plans = [],
  minItems,
  maxItems,
}: Props) {
  const list = plans.slice(0, maxItems ?? plans.length);
  if (!list.length || list.length < (minItems ?? 0)) return null;

  const colClass =
    {
      1: "md:grid-cols-1",
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
    }[list.length] || "md:grid-cols-3";

  return (
    <section className={cn("grid grid-cols-1 gap-6", colClass)}>
      {list.map((plan, i) => (
        <div
          key={i}
          className={cn(
            "flex flex-col rounded border p-6",
            plan.featured && "border-primary"
          )}
        >
          <h3 className="text-xl font-semibold">{plan.title}</h3>
          <p className="mt-2 text-2xl font-bold">{plan.price}</p>
          <ul className="mt-4 flex-1 space-y-2 text-sm">
            {plan.features.map((f, idx) => (
              <li key={idx}>{f}</li>
            ))}
          </ul>
          <Button asChild className="mt-6 self-start">
            <a href={plan.ctaHref}>{plan.ctaLabel}</a>
          </Button>
        </div>
      ))}
    </section>
  );
}

