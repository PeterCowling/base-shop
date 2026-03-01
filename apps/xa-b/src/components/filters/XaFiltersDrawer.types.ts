import type { FilterConfig, FilterKey } from "../../lib/xaFilters";

export type DrawerSection = { kind: "filter"; config: FilterConfig } | { kind: "price" };

export type XaFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterConfigs: FilterConfig[];
  facetValues: Record<FilterKey, string[]>;
  draftValues: Record<FilterKey, Set<string>>;
  draftInStock: boolean;
  draftSale: boolean;
  draftNewIn: boolean;
  draftMin: string;
  draftMax: string;
  onToggleValue: (key: FilterKey, value: string) => void;
  onChangeInStock: (value: boolean) => void;
  onChangeSale: (value: boolean) => void;
  onChangeNewIn: (value: boolean) => void;
  onChangeMin: (value: string) => void;
  onChangeMax: (value: string) => void;
  onClear: () => void;
  onApply: () => void;
};
