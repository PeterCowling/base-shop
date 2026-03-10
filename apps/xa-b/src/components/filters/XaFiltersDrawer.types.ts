import type { FilterConfig, FilterKey } from "../../lib/xaFilters";

export type DrawerSection = { kind: "filter"; config: FilterConfig } | { kind: "price" };

export type XaFilterConfig = {
  filterConfigs: FilterConfig[];
  facetValues: Record<FilterKey, string[]>;
};

export type XaFilterState = {
  open: boolean;
  draftValues: Record<FilterKey, Set<string>>;
  draftInStock: boolean;
  draftNewIn: boolean;
  draftMin: string;
  draftMax: string;
};

export type XaFilterActions = {
  onOpenChange: (open: boolean) => void;
  onToggleValue: (key: FilterKey, value: string) => void;
  onChangeInStock: (value: boolean) => void;
  onChangeNewIn: (value: boolean) => void;
  onChangeMin: (value: string) => void;
  onChangeMax: (value: string) => void;
  onClear: () => void;
  onApply: () => void;
};

export type XaFiltersDrawerProps = {
  config: XaFilterConfig;
  state: XaFilterState;
  actions: XaFilterActions;
};
