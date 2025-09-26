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
          {/* Render a plain anchor to ensure link role in tests */}
          <a
            href={plan.ctaHref}
            className={cn(
              "mt-6 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "self-start"
            )}
          >
            {plan.ctaLabel}
          </a>
        </div>
      ))}
    </section>
  );
}
