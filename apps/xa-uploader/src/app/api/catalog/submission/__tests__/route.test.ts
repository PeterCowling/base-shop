import { Readable } from "node:stream";

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const listCatalogDraftsMock = jest.fn();
const readCloudDraftSnapshotMock = jest.fn();
const parseStorefrontMock = jest.fn();
const buildSubmissionZipStreamMock = jest.fn();
const buildSubmissionZipFromCloudDraftsMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const isLocalFsRuntimeEnabledMock = jest.fn();

jest.mock("../../../../../lib/catalogCsv", () => ({
  listCatalogDrafts: (...args: unknown[]) => listCatalogDraftsMock(...args),
}));

jest.mock("../../../../../lib/catalogStorefront.ts", () => ({
  parseStorefront: (...args: unknown[]) => parseStorefrontMock(...args),
}));

jest.mock("../../../../../lib/catalogDraftContractClient", () => ({
  readCloudDraftSnapshot: (...args: unknown[]) => readCloudDraftSnapshotMock(...args),
}));

jest.mock("../../../../../lib/submissionZip", () => ({
  buildSubmissionZipStream: (...args: unknown[]) => buildSubmissionZipStreamMock(...args),
  buildSubmissionZipFromCloudDrafts: (...args: unknown[]) => buildSubmissionZipFromCloudDraftsMock(...args),
}));

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/localFsGuard", () => ({
  isLocalFsRuntimeEnabled: (...args: unknown[]) => isLocalFsRuntimeEnabledMock(...args),
}));

describe("catalog submission route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    isLocalFsRuntimeEnabledMock.mockReturnValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");
    listCatalogDraftsMock.mockResolvedValue({
      path: "/repo/apps/xa-uploader/data/products.csv",
      products: [],
      revisionsById: {},
    });
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [],
      revisionsById: {},
      docRevision: "doc-1",
    });
  });

  it("returns invalid class for known submission validation errors", async () => {
    buildSubmissionZipStreamMock.mockRejectedValueOnce(
      new Error("Select 1–10 products per submission."),
    );

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: [] }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "invalid",
        reason: "submission_validation_failed",
      }),
    );
  });

  it("uses cloud submission builder when local fs runtime is disabled", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);
    readCloudDraftSnapshotMock.mockResolvedValueOnce({
      products: [
        {
          id: "p1",
          slug: "studio-jacket",
          title: "Studio Jacket",
          brandHandle: "atelier-x",
          collectionHandle: "outerwear",
          collectionTitle: "Outerwear",
          price: "189",
          description: "A structured layer.",
          createdAt: "2025-12-01T12:00:00.000Z",
          forSale: true,
          forRental: false,
          popularity: "0",
          deposit: "0",
          stock: "0",
          sizes: "S|M|L",
          taxonomy: {
            department: "women",
            category: "clothing",
            subcategory: "outerwear",
            color: "black",
            material: "wool",
          },
          imageFiles: "studio-jacket-front.jpg|studio-jacket-side.jpg",
          imageAltTexts: "Studio jacket front|Studio jacket side",
          imageRoles: "front|side",
        },
      ],
      revisionsById: {},
      docRevision: "doc-1",
    });
    const stream = Readable.from(Buffer.from([80, 75, 3, 4]));
    buildSubmissionZipFromCloudDraftsMock.mockResolvedValueOnce({
      filename: "submission.zip",
      manifest: { submissionId: "sub-1", suggestedR2Key: "submissions/test.zip" },
      stream,
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: ["studio-jacket"] }),
      }),
    );

    expect(response.status).toBe(200);
    expect(buildSubmissionZipFromCloudDraftsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        products: expect.arrayContaining([
          expect.objectContaining({ slug: "studio-jacket", title: "Studio Jacket" }),
        ]),
      }),
    );
    expect(response.headers.get("Content-Type")).toBe("application/zip");
  });

  it("returns internal_error for unknown submission failures without leaking raw error text", async () => {
    buildSubmissionZipStreamMock.mockRejectedValueOnce(
      new Error("EACCES /Users/petercowling/base-shop/apps/xa-uploader/data/products.csv"),
    );

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: ["studio-jacket"] }),
      }),
    );

    expect(response.status).toBe(500);
    const payload = (await response.json()) as { error?: string; reason?: string };
    expect(payload.error).toBe("internal_error");
    expect(payload.reason).toBe("submission_export_failed");
    expect(JSON.stringify(payload)).not.toContain("EACCES");
    expect(JSON.stringify(payload)).not.toContain("/Users/petercowling");
  });
});
