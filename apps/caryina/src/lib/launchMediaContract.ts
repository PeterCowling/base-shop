import type { MediaItem } from "@acme/types";

export const LAUNCH_REQUIRED_MEDIA_SLOTS = [
  "hero",
  "angle",
  "detail",
  "on_body",
  "scale",
  "alternate",
] as const;

export const LAUNCH_OPTIONAL_MEDIA_SLOTS = ["video_optional"] as const;

export type LaunchRequiredMediaSlot =
  (typeof LAUNCH_REQUIRED_MEDIA_SLOTS)[number];
export type LaunchOptionalMediaSlot =
  (typeof LAUNCH_OPTIONAL_MEDIA_SLOTS)[number];
export type LaunchMediaSlot = LaunchRequiredMediaSlot | LaunchOptionalMediaSlot;

export const LAUNCH_MEDIA_SLOT_ORDER: readonly LaunchMediaSlot[] = [
  ...LAUNCH_REQUIRED_MEDIA_SLOTS,
  ...LAUNCH_OPTIONAL_MEDIA_SLOTS,
];

const SLOT_TAG_PREFIX = "slot:";
const SLOT_ORDER_INDEX = new Map<LaunchMediaSlot, number>(
  LAUNCH_MEDIA_SLOT_ORDER.map((slot, index) => [slot, index]),
);

const SLOT_ROLE_ALIASES: Record<string, LaunchMediaSlot> = {
  hero: "hero",
  angle: "angle",
  alt: "angle",
  alternate_angle: "angle",
  detail: "detail",
  macro: "detail",
  on_body: "on_body",
  onbody: "on_body",
  scale: "scale",
  alternate: "alternate",
  alt_2: "alternate",
  video_optional: "video_optional",
  video: "video_optional",
};

type LaunchMediaValidationErrorCode =
  | "missing_slot_tag"
  | "multiple_slot_tags"
  | "unknown_slot_role"
  | "duplicate_slot_role"
  | "invalid_required_slot_media_type"
  | "invalid_video_slot"
  | "missing_required_slot";

export interface LaunchMediaValidationError {
  code: LaunchMediaValidationErrorCode;
  message: string;
  mediaIndex?: number;
  role?: string;
}

export interface LaunchSkuMediaInput {
  id: string;
  slug: string;
  media: ReadonlyArray<MediaItem>;
}

export interface TypedMediaSlot {
  role: LaunchMediaSlot;
  media: MediaItem;
  mediaIndex: number;
}

export interface LaunchSkuMediaValidationResult {
  skuId: string;
  slug: string;
  ok: boolean;
  typedSlots: TypedMediaSlot[];
  missingRequiredSlots: LaunchRequiredMediaSlot[];
  errors: LaunchMediaValidationError[];
}

export interface LaunchCatalogMediaValidationResult {
  ok: boolean;
  skuResults: LaunchSkuMediaValidationResult[];
  failingSkus: LaunchSkuMediaValidationResult[];
}

function normalizeRoleKey(rawRole: string): string {
  return rawRole.trim().toLowerCase().replace(/-/g, "_");
}

type SlotTagRoleResult =
  | {
      role: LaunchMediaSlot;
      error?: undefined;
    }
  | {
      role: null;
      error: Omit<LaunchMediaValidationError, "mediaIndex">;
    };

function extractSlotTagRole(tags: ReadonlyArray<string> | undefined): SlotTagRoleResult {
  if (!tags || tags.length === 0) {
    return {
      role: null,
      error: {
        code: "missing_slot_tag",
        message: "missing slot tag (`slot:<role>`)",
      },
    };
  }

  const slotTags = tags.filter((tag) =>
    tag.toLowerCase().startsWith(SLOT_TAG_PREFIX),
  );
  if (slotTags.length === 0) {
    return {
      role: null,
      error: {
        code: "missing_slot_tag",
        message: "missing slot tag (`slot:<role>`)",
      },
    };
  }

  if (slotTags.length > 1) {
    return {
      role: null,
      error: {
        code: "multiple_slot_tags",
        message: `multiple slot tags found (${slotTags.join(", ")})`,
      },
    };
  }

  const slotTag = slotTags[0];
  const rawRole = slotTag.slice(SLOT_TAG_PREFIX.length).trim();
  const role = SLOT_ROLE_ALIASES[normalizeRoleKey(rawRole)];

  if (!role) {
    return {
      role: null,
      error: {
        code: "unknown_slot_role",
        role: rawRole,
        message: `unknown slot role \`${rawRole}\``,
      },
    };
  }

  return { role };
}

function sortTypedSlots(slots: TypedMediaSlot[]): TypedMediaSlot[] {
  return slots
    .slice()
    .sort((left, right) => {
      const leftOrder = SLOT_ORDER_INDEX.get(left.role);
      const rightOrder = SLOT_ORDER_INDEX.get(right.role);
      if (leftOrder === undefined || rightOrder === undefined) return 0;
      return leftOrder - rightOrder;
    });
}

export function validateLaunchSkuMedia(
  sku: LaunchSkuMediaInput,
): LaunchSkuMediaValidationResult {
  const errors: LaunchMediaValidationError[] = [];
  const slotsByRole = new Map<LaunchMediaSlot, TypedMediaSlot>();

  sku.media.forEach((media, mediaIndex) => {
    const roleResult = extractSlotTagRole(media.tags);
    if (!roleResult.role) {
      errors.push({
        ...roleResult.error,
        mediaIndex,
      });
      return;
    }

    const role = roleResult.role;
    const duplicate = slotsByRole.get(role);
    if (duplicate) {
      errors.push({
        code: "duplicate_slot_role",
        role,
        mediaIndex,
        message: `duplicate slot role \`${role}\` (already used by media[${duplicate.mediaIndex}])`,
      });
      return;
    }

    if (role === "video_optional" && media.type !== "video") {
      errors.push({
        code: "invalid_video_slot",
        role,
        mediaIndex,
        message: "slot `video_optional` must use media type `video`",
      });
      return;
    }

    if (role !== "video_optional" && media.type !== "image") {
      errors.push({
        code: "invalid_required_slot_media_type",
        role,
        mediaIndex,
        message: `slot \`${role}\` must use media type \`image\``,
      });
      return;
    }

    slotsByRole.set(role, { role, media, mediaIndex });
  });

  const missingRequiredSlots = LAUNCH_REQUIRED_MEDIA_SLOTS.filter(
    (slot) => !slotsByRole.has(slot),
  );
  missingRequiredSlots.forEach((role) => {
    errors.push({
      code: "missing_required_slot",
      role,
      message: `missing required slot \`${role}\``,
    });
  });

  const typedSlots = sortTypedSlots(Array.from(slotsByRole.values()));

  return {
    skuId: sku.id,
    slug: sku.slug,
    ok: errors.length === 0,
    typedSlots,
    missingRequiredSlots,
    errors,
  };
}

export function validateLaunchCatalogMedia(
  skus: ReadonlyArray<LaunchSkuMediaInput>,
): LaunchCatalogMediaValidationResult {
  const skuResults = skus.map((sku) => validateLaunchSkuMedia(sku));
  const failingSkus = skuResults.filter((sku) => !sku.ok);
  return {
    ok: failingSkus.length === 0,
    skuResults,
    failingSkus,
  };
}

function formatSkuError(error: LaunchMediaValidationError): string {
  const rolePart = error.role ? ` role=${error.role}` : "";
  const indexPart =
    typeof error.mediaIndex === "number" ? ` media[${error.mediaIndex}]` : "";
  return `[${error.code}${indexPart}${rolePart}] ${error.message}`;
}

export function formatLaunchCatalogMediaValidation(
  result: LaunchCatalogMediaValidationResult,
): string {
  const total = result.skuResults.length;
  const failed = result.failingSkus.length;
  const passed = total - failed;

  const summary = result.ok
    ? `PASS launch-media-contract: ${passed}/${total} SKUs valid`
    : `FAIL launch-media-contract: ${failed}/${total} SKUs invalid`;

  if (result.ok) return summary;

  const details = result.failingSkus.map((skuResult) => {
    const missing = skuResult.missingRequiredSlots.length
      ? `missing required slots: ${skuResult.missingRequiredSlots.join(", ")}`
      : "missing required slots: none";
    const errorSummary = skuResult.errors.map(formatSkuError).join("; ");
    return `- ${skuResult.slug} (${skuResult.skuId}) -> ${missing}; ${errorSummary}`;
  });

  return [summary, ...details].join("\n");
}
