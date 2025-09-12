jest.mock("../sendgrid", () => ({
  SendgridProvider: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
}));

const resendProviderMock = jest
  .fn()
  .mockImplementation(() => ({ send: jest.fn() }));
jest.mock("../resend", () => ({ ResendProvider: resendProviderMock }));

describe("providers selection", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_PROVIDER;
  });

  it("selects correct provider by config", async () => {
    process.env.RESEND_API_KEY = "rk";
    const { loadProvider } = await import("../index");
    const provider = await loadProvider("resend");
    expect(provider).toBeTruthy();
    expect(resendProviderMock).toHaveBeenCalled();
  });

  it("falls back to default on unknown key", async () => {
    const { loadProvider } = await import("../index");
    const provider = await loadProvider("resend");
    expect(provider).toBeUndefined();
    expect(resendProviderMock).not.toHaveBeenCalled();
  });

  it("throws on missing implementation", async () => {
    process.env.EMAIL_PROVIDER = "unknown";
    const { getProviderOrder } = await import("../index");
    expect(() => getProviderOrder()).toThrow("Unsupported EMAIL_PROVIDER");
  });
});
