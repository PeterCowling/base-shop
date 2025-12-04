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
  /** Optional selection handler for list items (e.g., pickup selection) */
  onSelectStore?: (store: Store) => void;
  /** Currently selected store id to highlight (when onSelectStore is provided) */
  selectedStoreId?: string;
}

/**
 * Display a map alongside a list of store locations.
 */
export function StoreLocatorTemplate({
  stores,
  map,
  onSelectStore,
  selectedStoreId,
  className,
  ...props
}: StoreLocatorTemplateProps) {
  const listItemBaseClass = "rounded-md border p-4 w-full text-left"; // i18n-exempt -- DS-5678 layout classes only, no user-facing copy [ttl=2026-12-31]
  const interactiveListItemClass = "cursor-pointer transition hover:border-primary"; // i18n-exempt -- DS-5678 layout classes only, no user-facing copy [ttl=2026-12-31]
  const selectedListItemClass = "border-primary bg-primary/5"; // i18n-exempt -- DS-5678 layout classes only, no user-facing copy [ttl=2026-12-31]

  return (
    <div
      className={cn(
        "grid gap-6 md:grid-cols-2", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        className,
      )}
      {...props}
    >
      <div className="min-h-80 w-full">
        {map ?? <div className="bg-muted h-full w-full rounded-md" />}
      </div>
      <ul className="space-y-4">
        {stores.map((store) => {
          const isSelected = store.id === selectedStoreId;
          const itemClassName = cn(
            listItemBaseClass,
            onSelectStore && interactiveListItemClass,
            onSelectStore && isSelected && selectedListItemClass,
          );
          const content = (
            <>
              <h3 className="font-semibold">{store.name}</h3>
              <p className="text-muted-foreground text-sm">{store.address}</p>
            </>
          );

          return (
            <li key={store.id}>
              {onSelectStore ? (
                <button
                  type="button"
                  onClick={() => onSelectStore(store)}
                  aria-pressed={isSelected}
                  className={itemClassName}
                >
                  {content}
                </button>
              ) : (
                <div className={itemClassName}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
