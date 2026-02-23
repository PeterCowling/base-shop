import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const listCatalogDraftsMock = jest.fn();
const parseStorefrontMock = jest.fn();
const buildSubmissionZipStreamMock = jest.fn();
const hasUploaderSessionMock = jest.fn();

jest.mock("../../../../../lib/catalogCsv", () => ({
  listCatalogDrafts: (...args: unknown[]) => listCatalogDraftsMock(...args),
}));

jest.mock("../../../../../lib/catalogStorefront.ts", () => ({
  parseStorefront: (...args: unknown[]) => parseStorefrontMock(...args),
}));

jest.mock("../../../../../lib/submissionZip", () => ({
  buildSubmissionZipStream: (...args: unknown[]) => buildSubmissionZipStreamMock(...args),
}));

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

describe("catalog submission route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");
    listCatalogDraftsMock.mockResolvedValue({
      path: "/repo/apps/xa-uploader/data/products.csv",
      products: [],
      revisionsById: {},
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
