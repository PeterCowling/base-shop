/** @jest-environment node */

export const ensureHasPermission = jest.fn();

export const listMediaFiles = jest.fn();
export const uploadMediaFile = jest.fn();
export const updateMediaMetadataEntry = jest.fn();
export const deleteMediaFile = jest.fn();
export const getMediaOverviewForShop = jest.fn();

export const useTranslationsMock = jest.fn();

jest.mock("../common/auth", () => ({
  ensureHasPermission,
}));

jest.mock("@acme/platform-core/repositories/media.server", () => ({
  listMediaFiles,
  uploadMediaFile,
  updateMediaMetadataEntry,
  deleteMediaFile,
  getMediaOverviewForShop,
}));

jest.mock("@acme/i18n/useTranslations.server", () => ({
  useTranslations: useTranslationsMock,
}));

const DEFAULT_TRANSLATIONS: Record<string, string> = {
  "cms.media.errors.deleteFailed": "Failed to delete media item.",
  "cms.media.errors.fileTooLarge": "File too large",
  "cms.media.errors.invalidFilePath": "Invalid file path",
  "cms.media.errors.invalidFileType": "Invalid file type",
  "cms.media.errors.notFound": "Media file not found",
  "cms.media.errors.orientation.landscape": "Image orientation must be landscape",
  "cms.media.errors.orientation.portrait": "Image orientation must be portrait",
  "cms.media.errors.processImageFailed": "Failed to process image",
  "cms.media.errors.uploadFailed": "Upload failed",
};

export const resetMediaMocks = () => {
  jest.clearAllMocks();

  (ensureHasPermission as jest.Mock).mockResolvedValue({ user: { role: "admin" } });

  listMediaFiles.mockResolvedValue([]);
  uploadMediaFile.mockResolvedValue({ url: "/uploads/shop/file.jpg", type: "image" });
  updateMediaMetadataEntry.mockResolvedValue({ url: "/uploads/shop/file.jpg", type: "image" });
  deleteMediaFile.mockResolvedValue(undefined);
  getMediaOverviewForShop.mockResolvedValue({
    files: [],
    totalBytes: 0,
    imageCount: 0,
    videoCount: 0,
    recentUploads: [],
  });

  useTranslationsMock.mockImplementation(async () => {
    return (key: string) => DEFAULT_TRANSLATIONS[key] ?? key;
  });
};

export const restoreMediaMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

