export type TryOnMode = 'accessory' | 'garment';

export interface TryOnJob {
  id: string; // idempotency key (UUID v4)
  mode: TryOnMode;
  productId: string; // SKU or slug
  sourceImageUrl: string; // R2 object URL
  createdAt: string; // ISO
}

export interface TryOnResult {
  url: string; // public image URL (R2 or provider)
  width: number;
  height: number;
  expiresAt?: string; // ISO
}

export type TryOnErrorCode =
  | 'UPSTREAM_TIMEOUT'
  | 'INVALID_MASK'
  | 'QUOTA_EXCEEDED'
  | 'BAD_REQUEST'
  | 'PROVIDER_UNAVAILABLE'
  | 'UNKNOWN';

export interface ProviderMetrics {
  preprocessMs?: number;
  generateMs?: number;
}

export interface ProviderResponse {
  result?: TryOnResult;
  metrics?: ProviderMetrics;
  error?: { code: TryOnErrorCode; details?: string };
}

export interface TryOnMaterialHints {
  material?: 'denim' | 'satin' | 'leather' | 'cotton' | 'knit' | 'synthetic';
  glossiness?: number; // 0..1 hints relight strength
}

export interface TryOnMeta {
  physical?: { widthMm?: number; heightMm?: number; depthMm?: number };
  material?: TryOnMaterialHints['material'];
  tryOn?: { garmentFlat?: string; onModelExemplar?: string };
  assets3d?: { glb?: string; usdz?: string };
  /** Optional UI hint to anchor overlays for this product type */
  anchorHint?: 'head' | 'torso' | 'feet';
}
