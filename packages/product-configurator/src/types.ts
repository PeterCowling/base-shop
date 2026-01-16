export type SelectionState = Record<string, string>;

export type AssetTier = "mobile" | "desktop";

export interface ProductAssetVariant {
  tiers: Partial<Record<AssetTier, string>>;
  slot?: string;
}

export interface ProductAssetPart {
  defaultVariant?: string;
  hideBaseMeshes?: string[];
  variants: Record<string, ProductAssetVariant>;
}

export interface ProductAssetSelectionBinding {
  match: Record<string, string>;
  set?: Record<string, string | null>;
}

export interface ProductAssetManifest {
  version: string;
  base: {
    tiers: Record<AssetTier, string>;
    slots?: Record<string, string>;
    animations?: Record<string, string>;
    proceduralOpen?: ProductAssetProceduralOpen;
  };
  parts?: Record<string, ProductAssetPart>;
  selectionBindings?: ProductAssetSelectionBinding[];
  poster?: string;
  hdri?: string;
}

export interface ProductAssetProceduralOpen {
  nodeName: string;
  axis: "x" | "y" | "z";
  degrees: number;
  pivot?: {
    x?: number;
    y?: number;
    z?: number;
  };
}

export interface ProductConfigSchema {
  productId: string;
  version: string;
  assets?: ProductAssetManifest;

  regions: Array<{
    regionId: "body" | "handle" | "hardware" | "lining" | "personalization";
    displayName: string;
    hotspotId?: string;
    focusTargetNode?: string;
  }>;

  properties: Array<{
    key: string;
    displayName: string;
    regionId: string;
    type: "enum";
      values: Array<{
      value: string;
      label: string;
      priceDelta?: number;
      materialBindings?: Array<{
        meshNamePattern: string;
        materialPresetId?: string;
        materialName?: string;
      }>;
      assetBindings?: Array<{
        partId: string;
        variantId: string | null;
      }>;
    }>;
    defaultValue: string;
  }>;
}

export interface ProductHotspotConfig {
  productId: string;
  version: string;
  hotspots: Array<{
    id: string;
    regionId: ProductConfigSchema["regions"][number]["regionId"];
    label?: string;
    nodeName?: string;
    focusTargetNode?: string;
    offset?: { x: number; y: number };
    propertyKeys?: string[];
  }>;
}

export interface ValidateResponse {
  valid: boolean;
  normalizedSelections: SelectionState;
  blockedReasons: Array<{ code: string; message: string }>;
  allowedDomainsDelta: Record<string, string[]>;
}
