import type { SKU } from "@acme/types";

import {
  LAUNCH_REQUIRED_MEDIA_SLOTS,
  type LaunchMediaSlot,
  type LaunchRequiredMediaSlot,
  validateLaunchSkuMedia,
} from "./launchMediaContract";

const SLOT_LABELS: Record<LaunchRequiredMediaSlot, string> = {
  hero: "Hero",
  angle: "Angle",
  detail: "Detail",
  on_body: "On-body",
  scale: "Scale",
  alternate: "Alternate",
};

const SLOT_FALLBACK_SRC: Record<LaunchRequiredMediaSlot, string> = {
  hero: "/images/hbag/hero.svg",
  angle: "/images/hbag/angle.svg",
  detail: "/images/hbag/detail.svg",
  on_body: "/images/hbag/on_body.svg",
  scale: "/images/hbag/scale.svg",
  alternate: "/images/hbag/alternate.svg",
};

export const LAUNCH_FAMILY_ANCHORS = [
  {
    key: "top-handle",
    label: "Top Handle",
    description: "Structured silhouettes for day-to-evening carry.",
  },
  {
    key: "shoulder",
    label: "Shoulder",
    description: "Soft-volume silhouettes with polished hardware focus.",
  },
  {
    key: "mini",
    label: "Mini",
    description: "Scaled silhouettes for light, occasion-led styling.",
  },
] as const;

export type LaunchFamilyKey = (typeof LAUNCH_FAMILY_ANCHORS)[number]["key"];

export interface CatalogCardMediaModel {
  primarySrc: string;
  primaryAlt: string;
  secondarySrc: string | null;
  secondaryAlt: string | null;
}

export interface ProductGalleryItem {
  id: string;
  role: LaunchMediaSlot;
  roleLabel: string;
  src: string;
  type: "image" | "video";
  alt: string;
  isFallback: boolean;
}

export interface LaunchFamilyAnchor {
  key: LaunchFamilyKey;
  label: string;
  description: string;
  href: string;
  productCount: number;
  heroImageSrc: string;
}

interface FamilyEntry {
  key: LaunchFamilyKey;
  product: SKU;
}

function fallbackSrc(role: LaunchRequiredMediaSlot): string {
  return SLOT_FALLBACK_SRC[role];
}

function fallbackAlt(title: string, role: LaunchRequiredMediaSlot): string {
  return `${title} ${SLOT_LABELS[role]} view`;
}

interface RoleImageResult {
  src: string;
  alt: string;
  found: boolean;
}

function resolveRoleImages(
  sku: Pick<SKU, "id" | "slug" | "title" | "media">,
): Record<LaunchRequiredMediaSlot, RoleImageResult> {
  const validation = validateLaunchSkuMedia({
    id: sku.id,
    slug: sku.slug,
    media: sku.media ?? [],
  });

  return LAUNCH_REQUIRED_MEDIA_SLOTS.reduce(
    (accumulator, role) => {
      const typedSlot = validation.typedSlots.find(
        (slot) => slot.role === role && slot.media.type === "image",
      );
      accumulator[role] = {
        src: typedSlot?.media.url ?? fallbackSrc(role),
        alt: typedSlot?.media.altText ?? fallbackAlt(sku.title, role),
        found: Boolean(typedSlot),
      };
      return accumulator;
    },
    {} as Record<LaunchRequiredMediaSlot, RoleImageResult>,
  );
}

function classifySkuFamily(sku: Pick<SKU, "slug">, index: number): LaunchFamilyKey {
  const slug = sku.slug.toLowerCase();
  if (slug.includes("mini")) return "mini";
  if (slug.includes("shoulder") || slug.includes("crossbody")) return "shoulder";
  if (slug.includes("top") || slug.includes("handle")) return "top-handle";

  const fallbackOrder: LaunchFamilyKey[] = ["top-handle", "shoulder", "mini"];
  return fallbackOrder[index % fallbackOrder.length];
}

export function resolveLaunchFamily(value: string | undefined): LaunchFamilyKey | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const family = LAUNCH_FAMILY_ANCHORS.find((item) => item.key === normalized);
  return family?.key ?? null;
}

export function buildCatalogCardMedia(
  sku: Pick<SKU, "id" | "slug" | "title" | "media">,
): CatalogCardMediaModel {
  const roleImages = resolveRoleImages(sku);
  const hero = roleImages.hero;
  const angle = roleImages.angle;
  const alternate = roleImages.alternate;

  const secondary = angle.found ? angle : alternate.found ? alternate : null;
  return {
    primarySrc: hero.src,
    primaryAlt: hero.alt,
    secondarySrc: secondary?.src ?? null,
    secondaryAlt: secondary?.alt ?? null,
  };
}

export function buildProductGalleryItems(
  sku: Pick<SKU, "id" | "slug" | "title" | "media">,
): ProductGalleryItem[] {
  const validation = validateLaunchSkuMedia({
    id: sku.id,
    slug: sku.slug,
    media: sku.media ?? [],
  });
  const roleImages = resolveRoleImages(sku);

  const requiredItems = LAUNCH_REQUIRED_MEDIA_SLOTS.map((role) => {
    const typedSlot = validation.typedSlots.find((slot) => slot.role === role);
    const roleImage = roleImages[role];
    return {
      id: `${sku.id}-${role}`,
      role,
      roleLabel: SLOT_LABELS[role],
      src: roleImage.src,
      type: "image" as const,
      alt: roleImage.alt,
      isFallback: !typedSlot || !roleImage.found,
    };
  });

  const optionalVideo = validation.typedSlots.find(
    (slot) => slot.role === "video_optional" && slot.media.type === "video",
  );

  if (!optionalVideo) return requiredItems;

  return [
    ...requiredItems,
    {
      id: `${sku.id}-video_optional`,
      role: "video_optional",
      roleLabel: "Video",
      src: optionalVideo.media.url,
      type: "video",
      alt: optionalVideo.media.altText ?? `${sku.title} product video`,
      isFallback: false,
    },
  ];
}

function familiesForSkus(skus: ReadonlyArray<SKU>): FamilyEntry[] {
  return skus.map((sku, index) => ({
    key: classifySkuFamily(sku, index),
    product: sku,
  }));
}

export function filterSkusByLaunchFamily(
  skus: ReadonlyArray<SKU>,
  family: LaunchFamilyKey | null,
): SKU[] {
  if (!family) return [...skus];
  return familiesForSkus(skus)
    .filter((entry) => entry.key === family)
    .map((entry) => entry.product);
}

export function buildLaunchFamilyAnchors(
  skus: ReadonlyArray<SKU>,
  lang: string,
): LaunchFamilyAnchor[] {
  const families = familiesForSkus(skus);

  return LAUNCH_FAMILY_ANCHORS.map((definition) => {
    const matches = families.filter((entry) => entry.key === definition.key);
    const heroProduct = matches[0]?.product ?? skus[0] ?? null;
    const heroImageSrc = heroProduct
      ? buildCatalogCardMedia(heroProduct).primarySrc
      : fallbackSrc("hero");
    return {
      key: definition.key,
      label: definition.label,
      description: definition.description,
      href: `/${lang}/shop?family=${definition.key}`,
      productCount: matches.length,
      heroImageSrc,
    };
  });
}
