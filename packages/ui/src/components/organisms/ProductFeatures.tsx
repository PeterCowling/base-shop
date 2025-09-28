import { CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { cn } from "../../utils/style";

export interface ProductFeaturesProps
  extends React.HTMLAttributes<HTMLUListElement> {
  features: string[];
}

export function ProductFeatures({
  features,
  className,
  ...props
}: ProductFeaturesProps) {
  return (
    <ul className={cn("space-y-2", className)} {...props}>
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2">
          <CheckIcon className="mt-1 h-4 w-4 shrink-0" />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}
