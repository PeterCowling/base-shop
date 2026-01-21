/** @jest-environment node */

// fs mocks
export const fsMock = {
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn(),
    stat: jest.fn(),
    readdir: jest.fn(),
  },
  existsSync: jest.fn(() => true),
  // top-level aliases for tests that access directly
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn(),
  stat: jest.fn(),
  readdir: jest.fn(),
};

// Additional mocks
export const writeJsonFileMock = jest.fn();
export const sharpMetadataMock = jest.fn().mockResolvedValue({ width: 100, height: 100, format: "jpeg" });
export const ulidMock = jest.fn(() => "mock-ulid");

jest.mock("fs", () => fsMock);
jest.mock("@/lib/server/jsonIO", () => ({ writeJsonFile: writeJsonFileMock }));
jest.mock("sharp", () => () => ({ metadata: sharpMetadataMock }));
jest.mock("ulid", () => ({ ulid: ulidMock }));

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

