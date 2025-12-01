import type { PageComponent } from "@acme/types";

/**
 * Stable identifier for a Page Builder block type.
 *
 * At runtime this corresponds to the `type` discriminator on `PageComponent`
 * values. Keeping the alias here makes the contract explicit for both CMS
 * and runtime apps.
 */
export type BlockTypeId = PageComponent["type"];

/**
 * Narrow a `PageComponent` union to the variant for a given block `type`.
 *
 * This is useful when registries or helpers want to express the expected
 * props shape for a specific block type.
 */
export type BlockProps<TType extends BlockTypeId = BlockTypeId> = Extract<
  PageComponent,
  { type: TType }
>;

/**
 * Shared capability flags for blocks.
 *
 * These are intentionally small and can be extended over time as more
 * consumers (Configurator, health checks, templates) need richer metadata.
 */
export interface BlockFeatureFlags {
  /** Block can render or otherwise depend on product/catalogue data. */
  supportsProducts?: boolean;
  /** Block can render media (images, video, galleries, etc.). */
  supportsMedia?: boolean;
}

/**
 * React‑agnostic descriptor for a block type.
 *
 * This captures the stable `type` identifier plus lightweight mapping
 * metadata that both CMS and runtime apps can rely on without importing
 * UI components.
 */
export interface BlockDescriptor<
  TType extends BlockTypeId = BlockTypeId,
  Features extends BlockFeatureFlags = BlockFeatureFlags,
> {
  /** Unique block type id, aligned with `PageComponent["type"]`. */
  type: TType;
  /** Optional human‑readable label for palettes and tooling. */
  label?: string;
  /** Optional category identifier (e.g. "Hero", "Commerce", "Layout"). */
  category?: string;
  /** Capability flags shared between CMS and runtime. */
  features?: Features;
}

/**
 * Map of block type id → descriptor.
 *
 * Not every app needs to know about every block; this is intentionally
 * partial and can be extended incrementally.
 */
export type BlockDescriptorMap<
  Features extends BlockFeatureFlags = BlockFeatureFlags,
> = Partial<Record<BlockTypeId, BlockDescriptor<BlockTypeId, Features>>>;

/**
 * Generic block registry used by CMS and runtime apps.
 *
 * Each entry is app‑specific (typically a React component plus metadata),
 * but they all share the same `BlockTypeId` vocabulary.
 */
export type BlockRegistry<TEntry> = Partial<Record<BlockTypeId, TEntry>>;

/**
 * Entry config used when building registries in a type‑safe way.
 */
export interface BlockRegistryEntryConfig<TEntry> {
  type: BlockTypeId;
  entry: TEntry;
}

/**
 * Build descriptor and registry maps from shared descriptors and per‑app
 * registry entries.
 *
 * This keeps the block‑type vocabulary (descriptors) in one place while
 * allowing each app to provide its own rendering implementation.
 */
export function buildBlockRegistry<TEntry>(
  descriptors: readonly BlockDescriptor[],
  entries: readonly BlockRegistryEntryConfig<TEntry>[],
): {
  descriptors: BlockDescriptorMap;
  registry: BlockRegistry<TEntry>;
} {
  const descriptorMap: BlockDescriptorMap = {};
  for (const descriptor of descriptors) {
    descriptorMap[descriptor.type] = descriptor;
  }

  const registry: BlockRegistry<TEntry> = {};
  for (const { type, entry } of entries) {
    registry[type] = entry;
  }

  return { descriptors: descriptorMap, registry };
}

