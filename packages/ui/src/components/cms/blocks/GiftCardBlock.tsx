import { useState } from "react";
import { Button } from "../../atoms/shadcn";

interface Props {
  amounts?: number[];
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/** Displays gift card denominations with a purchase button */
export default function GiftCardBlock({
  amounts = [],
  description,
  ctaLabel = "Purchase",
  ctaHref = "#",
}: Props) {
  const [selected, setSelected] = useState<number | null>(
    amounts.length ? amounts[0] : null
  );

  if (!amounts.length) return null;

  const href = selected !== null ? `${ctaHref}?amount=${selected}` : ctaHref;

  return (
    <section className="space-y-4">
      {description && <p>{description}</p>}
      <div className="flex flex-wrap gap-2">
        {amounts.map((amt) => (
          <Button
            key={amt}
            type="button"
            variant={selected === amt ? "default" : "outline"}
            onClick={() => setSelected(amt)}
          >
            {`$${amt}`}
          </Button>
        ))}
      </div>
      <Button asChild>
        <a href={href}>{ctaLabel}</a>
      </Button>
    </section>
  );
}
