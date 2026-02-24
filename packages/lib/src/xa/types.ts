export type XaDepartment = "women" | "men";
export type XaCategory = "clothing" | "bags" | "jewelry";

export type XaProductTaxonomy = {
  department: XaDepartment;
  category: XaCategory;
  subcategory: string;
  color: string[];
  material: string[];
  fit?: string;
  length?: string;
  neckline?: string;
  sleeveLength?: string;
  pattern?: string;
  occasion?: string[];
  sizeClass?: string;
  strapStyle?: string;
  hardwareColor?: string;
  closureType?: string;
  fits?: string[];
  metal?: string;
  gemstone?: string;
  jewelrySize?: string;
  jewelryStyle?: string;
  jewelryTier?: string;
};

export type XaProductDetails = {
  modelHeight?: string;
  modelSize?: string;
  fitNote?: string;
  fabricFeel?: string;
  care?: string;
  dimensions?: string;
  strapDrop?: string;
  whatFits?: string[];
  interior?: string[];
  sizeGuide?: string;
  warranty?: string;
};
