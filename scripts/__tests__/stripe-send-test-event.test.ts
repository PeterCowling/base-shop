/** @jest-environment node */
import "ts-node/register";

const readFileMock = jest.fn();
const fetchMock = jest.fn();

jest.mock("node:fs/promises", () => ({
  readFile: (...args: unknown[]) => readFileMock(...args),
}));

describe("sendStripeTestEvent", () => {
  const webhookUrl = "https://example.com/webhook";

  beforeEach(() => {
    readFileMock.mockReset();
    fetchMock.mockReset();
    (global as any).fetch = (...args: unknown[]) => fetchMock(...args);
  });

  it("posts fixture to provided webhook URL", async () => {
    const body = '{"type":"test.event"}';
    readFileMock.mockResolvedValue(body);
    fetchMock.mockResolvedValue({ ok: true, status: 200, statusText: "OK" });

    const { sendStripeTestEvent } = await import("../stripe-send-test-event.ts");
    const res = await sendStripeTestEvent("test-event", webhookUrl);

    expect(readFileMock).toHaveBeenCalledWith(
      expect.stringContaining("packages/stripe/test/fixtures/test-event.json"),
      "utf8",
    );
    expect(fetchMock).toHaveBeenCalledWith(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    expect(res.status).toBe(200);
  });

  it("handles missing event names", async () => {
    readFileMock.mockRejectedValue(new Error("not found"));
    const { sendStripeTestEvent } = await import("../stripe-send-test-event.ts");

    await expect(
      sendStripeTestEvent("missing-event", webhookUrl),
    ).rejects.toThrow("not found");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on non-OK responses", async () => {
    readFileMock.mockResolvedValue("{}");
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });
    const { sendStripeTestEvent } = await import("../stripe-send-test-event.ts");

    await expect(
      sendStripeTestEvent("test-event", webhookUrl),
    ).rejects.toThrow("Request failed: 500 Internal Server Error");
  });
});
