"use client";

import * as React from "react";

export interface PoliciesAccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  shipping?: string;
  returns?: string;
  warranty?: string;
  className?: string;
}

export default function PoliciesAccordion({ shipping, returns, warranty, className, ...rest }: PoliciesAccordionProps) {
  const items = [
    shipping ? { id: "shipping", title: "Shipping", content: shipping } : null,
    returns ? { id: "returns", title: "Returns", content: returns } : null,
    warranty ? { id: "warranty", title: "Warranty", content: warranty } : null,
  ].filter(Boolean) as { id: string; title: string; content: string }[];

  if (!items.length) return null;

  return (
    <div className={className} {...rest}>
      {items.map((it) => (
        <details key={it.id} className="border-b py-2">
          <summary className="cursor-pointer select-none font-medium">{it.title}</summary>
          <div className="prose mt-2 w-full text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: it.content }} />
        </details>
      ))}
    </div>
  );
}
