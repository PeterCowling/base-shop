export * from "./Cart";
export * from "./constants";
export * from "./ImageOrientation";
export * from "./InventoryItem";
export * from "./MediaItem";
export * from "./page";
export * from "./Pricing";
export * from "./Product";
export * from "./PublishLocation";
export * from "./RentalOrder";
export * from "./ReturnLogistics";
export * from "./Shop";
export * from "./ShopSettings";
export * from "./Coverage";

export interface ValuePropsComponent {
  id: string;
  type: "ValueProps";
  items?: { icon: string; title: string; desc: string }[];
  minItems?: number;
  maxItems?: number;
  [key: string]: unknown;
}
//# sourceMappingURL=index.d.ts.map
