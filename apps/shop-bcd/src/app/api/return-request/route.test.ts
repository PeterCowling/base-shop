import { POST } from "./route";
import { parseJsonBody } from "@shared-utils";
import { createReturnAuthorization } from "@platform-core/returnAuthorization";
import { sendEmail } from "@acme/email";
import { getReturnLogistics } from "@platform-core/returnLogistics";
import { getShopSettings } from "@platform-core/repositories/settings.server";

jest.mock("@shared-utils", () => ({
  parseJsonBody: jest.fn(),
}));

jest.mock("@platform-core/returnAuthorization", () => ({
  createReturnAuthorization: jest.fn(),
}));

jest.mock("@acme/email", () => ({
  sendEmail: jest.fn(),
}));

jest.mock("@platform-core/returnLogistics", () => ({
  getReturnLogistics: jest.fn(),
}));

jest.mock("@platform-core/repositories/settings.server", () => ({
  getShopSettings: jest.fn(),
}));

const mockParseJsonBody = parseJsonBody as jest.Mock;
const mockCreateReturnAuthorization = createReturnAuthorization as jest.Mock;
const mockSendEmail = sendEmail as jest.Mock;
const mockGetReturnLogistics = getReturnLogistics as jest.Mock;
const mockGetShopSettings = getShopSettings as jest.Mock;

describe("POST /api/return-request", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects when tags missing under strict rules", async () => {
    mockParseJsonBody.mockResolvedValue({
      success: true,
      data: {
        orderId: "o1",
        email: "user@example.com",
        hasTags: false,
        isWorn: false,
      },
    });
    mockGetReturnLogistics.mockResolvedValue({ requireTags: true, allowWear: true });
    mockGetShopSettings.mockResolvedValue({ luxuryFeatures: { strictReturnConditions: true } });

    const res = await POST(new Request("http://localhost"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ ok: false, error: "Return rejected" });
    expect(mockCreateReturnAuthorization).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("rejects when item worn under strict rules", async () => {
    mockParseJsonBody.mockResolvedValue({
      success: true,
      data: {
        orderId: "o2",
        email: "user@example.com",
        hasTags: true,
        isWorn: true,
      },
    });
    mockGetReturnLogistics.mockResolvedValue({ requireTags: false, allowWear: false });
    mockGetShopSettings.mockResolvedValue({ luxuryFeatures: { strictReturnConditions: true } });

    const res = await POST(new Request("http://localhost"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ ok: false, error: "Return rejected" });
    expect(mockCreateReturnAuthorization).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("creates return authorization and sends email on success", async () => {
    mockParseJsonBody.mockResolvedValue({
      success: true,
      data: {
        orderId: "o3",
        email: "user@example.com",
        hasTags: true,
        isWorn: false,
      },
    });
    mockGetReturnLogistics.mockResolvedValue({ requireTags: true, allowWear: false });
    mockGetShopSettings.mockResolvedValue({ luxuryFeatures: { strictReturnConditions: true } });
    mockCreateReturnAuthorization.mockResolvedValue({ raId: "RA123" });

    const res = await POST(new Request("http://localhost"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, raId: "RA123" });
    expect(mockCreateReturnAuthorization).toHaveBeenCalledWith({ orderId: "o3" });
    expect(mockSendEmail).toHaveBeenCalledWith(
      "user@example.com",
      "Return Authorization RA123",
      "Your return request for order o3 has been received. Your RA number is RA123.",
    );
  });
});

