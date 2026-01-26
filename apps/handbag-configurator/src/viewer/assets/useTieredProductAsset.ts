"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  AssetTier,
  ProductAssetManifest,
  ProductConfigSchema,
  SelectionState,
} from "@acme/product-configurator";

export type TierPreference = "auto" | AssetTier;

export type ResolvedPartAsset = {
  id: string;
  variantId: string;
  url: string;
  slotName?: string;
};

const IOS_REGEX = /iPad|iPhone|iPod/i;
const DEFAULT_HDRI = "hdri/studio_01.hdr";
const DEFAULT_POSTER = "poster.jpg";

function detectLowMemory(): boolean {
  if (typeof navigator === "undefined") return false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof memory === "number" && memory <= 4;
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return IOS_REGEX.test(navigator.userAgent);
}

function normalizeAssetPath(assetPath: string) {
  return assetPath.replace(/^\/+/, "").replace(/^assets\//, "");
}

function matchesSelection(
  selections: SelectionState | undefined,
  match: Record<string, string>,
) {
  if (!selections) return false;
  return Object.entries(match).every(([key, value]) => selections[key] === value);
}

function resolvePartVariants(
  manifest: ProductAssetManifest | undefined,
  selections: SelectionState | undefined,
  schema?: ProductConfigSchema,
) {
  const resolved: Record<string, string | null> = {};
  if (!manifest?.parts) return resolved;

  const partEntries = Object.entries(manifest.parts).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  for (const [partId, partDef] of partEntries) {
    if (partDef.defaultVariant) {
      resolved[partId] = partDef.defaultVariant;
    }
  }

  if (schema && selections) {
    for (const property of schema.properties) {
      const selected = selections[property.key] ?? property.defaultValue;
      const entry = property.values.find((value) => value.value === selected);
      for (const binding of entry?.assetBindings ?? []) {
        resolved[binding.partId] = binding.variantId;
      }
    }
  }

  for (const binding of manifest.selectionBindings ?? []) {
    if (!matchesSelection(selections, binding.match)) continue;
    for (const [partId, variantId] of Object.entries(binding.set ?? {})) {
      resolved[partId] = variantId;
    }
  }

  return resolved;
}

function resolveVariantPath(
  manifest: ProductAssetManifest | undefined,
  partId: string,
  variantId: string,
  tier: AssetTier,
) {
  const variant = manifest?.parts?.[partId]?.variants?.[variantId];
  if (!variant?.tiers) return null;
  const primary = variant.tiers[tier];
  const fallback =
    tier === "desktop" ? variant.tiers.mobile : variant.tiers.desktop;
  return primary ?? fallback ?? null;
}

function resolveParts({
  manifest,
  selections,
  schema,
  tier,
  productId,
}: {
  manifest: ProductAssetManifest | undefined;
  selections: SelectionState | undefined;
  schema?: ProductConfigSchema;
  tier: AssetTier;
  productId: string;
}) {
  const parts: ResolvedPartAsset[] = [];
  if (!manifest?.parts) return parts;
  const variantSelections = resolvePartVariants(manifest, selections, schema);

  const partEntries = Object.entries(manifest.parts).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  for (const [partId, partDef] of partEntries) {
    const variantId = variantSelections[partId];
    if (!variantId) continue;
    const variant = partDef.variants[variantId];
    if (!variant) continue;
    const path = resolveVariantPath(manifest, partId, variantId, tier);
    if (!path) continue;
    const slotName = variant.slot ?? manifest.base.slots?.[partId];
    parts.push({
      id: partId,
      variantId,
      url: getProductAssetUrl(productId, normalizeAssetPath(path)),
      ...(slotName ? { slotName } : {}),
    });
  }

  return parts;
}

function resolveHiddenBaseMeshes(
  manifest: ProductAssetManifest | undefined,
  parts: ResolvedPartAsset[],
) {
  if (!manifest?.parts || parts.length === 0) return [];
  const hidden = new Set<string>();
  for (const part of parts) {
    const partDef = manifest.parts[part.id];
    for (const pattern of partDef?.hideBaseMeshes ?? []) {
      hidden.add(pattern);
    }
  }
  return Array.from(hidden);
}

export function getProductAssetUrl(productId: string, assetPath: string) {
  return `/api/products/${productId}/assets/${assetPath}`;
}

export function useTieredProductAsset(
  productId: string,
  options?: {
    schema?: ProductConfigSchema;
    selections?: SelectionState;
  },
) {
  const [preferredTier, setPreferredTier] = useState<TierPreference>("auto");
  const [deviceTier, setDeviceTier] = useState<AssetTier>("desktop");

  useEffect(() => {
    const isMobileTier = detectIOS() || detectLowMemory();
    setDeviceTier(isMobileTier ? "mobile" : "desktop");
  }, []);

  const effectiveTier = preferredTier === "auto" ? deviceTier : preferredTier;
  const hdAllowed = deviceTier === "desktop";
  const manifest = options?.schema?.assets;

  const modelUrl = useMemo(() => {
    const manifestPath = manifest?.base?.tiers?.[effectiveTier];
    const fallbackPath = effectiveTier === "desktop" ? "desktop.glb" : "mobile.glb";
    return getProductAssetUrl(
      productId,
      normalizeAssetPath(manifestPath ?? fallbackPath),
    );
  }, [productId, manifest, effectiveTier]);

  const parts = useMemo(
    () =>
      resolveParts({
        manifest,
        selections: options?.selections,
        ...(options?.schema !== undefined ? { schema: options.schema } : {}),
        tier: effectiveTier,
        productId,
      }),
    [manifest, options?.selections, options?.schema, effectiveTier, productId],
  );
  const hideBaseMeshPatterns = useMemo(
    () => resolveHiddenBaseMeshes(manifest, parts),
    [manifest, parts],
  );

  const hdriUrl = useMemo(() => {
    const path = normalizeAssetPath(manifest?.hdri ?? DEFAULT_HDRI);
    return getProductAssetUrl(productId, path);
  }, [productId, manifest]);

  const posterUrl = useMemo(() => {
    const path = normalizeAssetPath(manifest?.poster ?? DEFAULT_POSTER);
    return getProductAssetUrl(productId, path);
  }, [productId, manifest]);

  return {
    preferredTier,
    setPreferredTier,
    deviceTier,
    effectiveTier,
    hdAllowed,
    modelUrl,
    parts,
    hideBaseMeshPatterns,
    hdriUrl,
    posterUrl,
    animationMap: manifest?.base?.animations,
    proceduralOpen: manifest?.base?.proceduralOpen,
  };
}
