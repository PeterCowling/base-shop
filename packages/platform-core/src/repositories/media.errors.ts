export const MEDIA_ERROR_DEFS = {
  FILE_TOO_LARGE: {
    message: "File is too large",
    messageKey: "cms.media.errors.fileTooLarge",
  },
  INVALID_FILE_TYPE: {
    message: "Invalid file type",
    messageKey: "cms.media.errors.invalidFileType",
  },
  ORIENTATION_LANDSCAPE_REQUIRED: {
    message: "Landscape image required",
    messageKey: "cms.media.errors.orientation.landscape",
  },
  ORIENTATION_PORTRAIT_REQUIRED: {
    message: "Portrait image required",
    messageKey: "cms.media.errors.orientation.portrait",
  },
  PROCESS_IMAGE_FAILED: {
    message: "Could not process image",
    messageKey: "cms.media.errors.processImageFailed",
  },
  UPLOAD_FAILED: {
    message: "Upload failed",
    messageKey: "cms.media.errors.uploadFailed",
  },
  INVALID_FILE_PATH: {
    message: "Invalid file path",
    messageKey: "cms.media.errors.invalidFilePath",
  },
  NOT_FOUND: {
    message: "Media item not found",
    messageKey: "cms.media.errors.notFound",
  },
} as const;

export type MediaErrorCode = keyof typeof MEDIA_ERROR_DEFS;

export class MediaError extends Error {
  readonly code: MediaErrorCode;
  readonly messageKey: (typeof MEDIA_ERROR_DEFS)[MediaErrorCode]["messageKey"];

  constructor(code: MediaErrorCode, options?: { cause?: unknown }) {
    super(MEDIA_ERROR_DEFS[code].message);
    this.name = "MediaError";
    this.code = code;
    this.messageKey = MEDIA_ERROR_DEFS[code].messageKey;
    if (options?.cause !== undefined) {
      // Node 18+ supports `cause`, but TS typings can vary based on lib.
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export function isMediaError(value: unknown): value is MediaError {
  return (
    value instanceof Error &&
    value.name === "MediaError" &&
    typeof (value as MediaError).code === "string"
  );
}

