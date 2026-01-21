/**
 * Media handling utilities for the platform.
 *
 * @module @acme/platform-core/media
 */

export {
  type BatchProcessResult,
  DEFAULT_BREAKPOINTS,
  // Constants
  DEFAULT_SIZE_PRESETS,
  DEFAULT_VALIDATION_RULES,
  // Functions - Dimension extraction
  extractImageDimensions,
  // Functions - Manifest
  generateImageManifest,
  generateSizes,
  // Functions - Responsive images
  generateSrcSet,
  hashImageContent,
  // Types
  type ImageFormat,
  type ImageManifestEntry,
  type ImageProcessingOptions,
  type ImageSizePreset,
  type ImageValidationResult,
  type ImageValidationRules,
  // Functions - Processing (requires sharp)
  isSharpAvailable,
  type ProcessedImage,
  type ProcessedVariant,
  processImage,
  processImageBatch,
  type SrcSetEntry,
  // Functions - Validation
  validateImage,
  writeImageManifest,
} from "./imageProcessing";
