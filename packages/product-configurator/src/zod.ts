import { z } from "zod";

export const selectionStateSchema = z.record(z.string());

export const regionIdSchema = z.enum([
  "body",
  "handle",
  "hardware",
  "lining",
  "personalization",
]);

const assetTierMapSchema = z.object({
  mobile: z.string().optional(),
  desktop: z.string().optional(),
});

const assetBaseSchema = z.object({
  tiers: z.object({
    mobile: z.string(),
    desktop: z.string(),
  }),
  slots: z.record(z.string()).optional(),
  animations: z.record(z.string()).optional(),
  proceduralOpen: z
    .object({
      nodeName: z.string(),
      axis: z.enum(["x", "y", "z"]),
      degrees: z.number(),
      pivot: z
        .object({
          x: z.number().optional(),
          y: z.number().optional(),
          z: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});

const assetVariantSchema = z.object({
  tiers: assetTierMapSchema,
  slot: z.string().optional(),
});

const assetPartSchema = z.object({
  defaultVariant: z.string().optional(),
  hideBaseMeshes: z.array(z.string()).optional(),
  variants: z.record(assetVariantSchema),
});

const assetSelectionBindingSchema = z.object({
  match: z.record(z.string()),
  set: z.record(z.union([z.string(), z.null()])).optional(),
});

const productAssetManifestSchema = z.object({
  version: z.string(),
  base: assetBaseSchema,
  parts: z.record(assetPartSchema).optional(),
  selectionBindings: z.array(assetSelectionBindingSchema).optional(),
  poster: z.string().optional(),
  hdri: z.string().optional(),
});

export const productConfigSchemaSchema = z.object({
  productId: z.string(),
  version: z.string(),
  assets: productAssetManifestSchema.optional(),
  regions: z.array(
    z.object({
      regionId: regionIdSchema,
      displayName: z.string(),
      hotspotId: z.string().optional(),
      focusTargetNode: z.string().optional(),
    }),
  ),
  properties: z.array(
    z.object({
      key: z.string(),
      displayName: z.string(),
      regionId: z.string(),
      type: z.literal("enum"),
      values: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
          priceDelta: z.number().optional(),
          materialBindings: z
            .array(
              z.object({
                meshNamePattern: z.string(),
                materialPresetId: z.string().optional(),
                materialName: z.string().optional(),
              }),
            )
            .optional(),
          assetBindings: z
            .array(
              z.object({
                partId: z.string(),
                variantId: z.string().nullable(),
              }),
            )
            .optional(),
        }),
      ),
      defaultValue: z.string(),
    }),
  ),
});

export const validateResponseSchema = z.object({
  valid: z.boolean(),
  normalizedSelections: selectionStateSchema,
  blockedReasons: z.array(
    z.object({
      code: z.string(),
      message: z.string(),
    }),
  ),
  allowedDomainsDelta: z.record(z.array(z.string())),
});
