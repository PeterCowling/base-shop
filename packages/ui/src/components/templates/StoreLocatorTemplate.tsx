import * as React from "react";
import { cn } from "../../utils/style";

export interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface StoreLocatorTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  stores: Store[];
  /** Optional map component to render on the page */
  map?: React.ReactNode;
}

/**
 * Display a map alongside a list of store locations.
 */
export function StoreLocatorTemplate({
  stores,
  map,
  className,
  ...props
}: StoreLocatorTemplateProps) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)} {...props}>
      <div className="min-h-80 w-full">
        {map ?? <div className="bg-muted h-full w-full rounded-md" />}
      </div>
      <ul className="space-y-4">
        {stores.map((store) => (
          <li key={store.id} className="rounded-md border p-4">
            <h3 className="font-semibold">{store.name}</h3>
            <p className="text-muted-foreground text-sm">{store.address}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
