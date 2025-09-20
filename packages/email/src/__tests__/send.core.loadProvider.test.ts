// Mock implementations will be configured per-test via the variables below.
let mockRenderTemplate: jest.Mock;
let mockSanitizeHtml: jest.Mock;
let mockHasProviderErrorFields: jest.Mock;
let mockCreateTransport: jest.Mock;
let mockSendMail: jest.Mock;
let mockGetDefaultSender: jest.Mock;

const mockSendgridImport = jest.fn();
const mockResendImport = jest.fn();
const SendgridProvider = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
}));
const ResendProvider = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
}));

jest.mock("../providers/sendgrid", () => {
  mockSendgridImport();
  return { SendgridProvider };
});

jest.mock("../providers/resend", () => {
  mockResendImport();
  return { ResendProvider };
});

jest.mock("../templates", () => ({
  renderTemplate: (...args: any[]) => mockRenderTemplate(...args),
}));

jest.mock("sanitize-html", () => {
  const fn: any = (...args: any[]) => mockSanitizeHtml(...args);
  fn.defaults = { allowedTags: [], allowedAttributes: {} };
  return { __esModule: true, default: fn };
});

jest.mock("../providers/error", () => ({
  hasProviderErrorFields: (...args: any[]) =>
    mockHasProviderErrorFields(...args),
}));

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: (...args: any[]) => mockCreateTransport(...args),
  },
}));

jest.mock("../config", () => ({
  getDefaultSender: (...args: any[]) => mockGetDefaultSender(...args),
}));

describe("send core – loadProvider", () => {
  beforeEach(() => {
    mockRenderTemplate = jest.fn();
    mockSanitizeHtml = jest.fn((html: string) => html);
    mockHasProviderErrorFields = jest.fn().mockReturnValue(true);
    mockSendMail = jest.fn();
    mockCreateTransport = jest.fn(() => ({
      sendMail: (...args: any[]) => mockSendMail(...args),
    }));
    mockGetDefaultSender = jest.fn(() => "from@example.com");
    SendgridProvider.mockClear();
    ResendProvider.mockClear();
    mockSendgridImport.mockClear();
    mockResendImport.mockClear();
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_URL;
  });

  it("imports and caches SendgridProvider", async () => {
    await jest.isolateModulesAsync(async () => {
      process.env.SENDGRID_API_KEY = "sg";
      const { loadProvider } = await import("../send");
      const first = await loadProvider("sendgrid");
      const second = await loadProvider("sendgrid");
      expect(first).toBe(second);
      expect(SendgridProvider).toHaveBeenCalledTimes(1);
      expect(mockSendgridImport).toHaveBeenCalledTimes(1);
    });
  });

  it("imports and caches ResendProvider", async () => {
    await jest.isolateModulesAsync(async () => {
      process.env.RESEND_API_KEY = "rs";
      const { loadProvider } = await import("../send");
      const first = await loadProvider("resend");
      const second = await loadProvider("resend");
      expect(first).toBe(second);
      expect(ResendProvider).toHaveBeenCalledTimes(1);
      expect(mockResendImport).toHaveBeenCalledTimes(1);
    });
  });

  it("returns undefined when keys are missing", async () => {
    await jest.isolateModulesAsync(async () => {
      const { loadProvider } = await import("../send");
      expect(await loadProvider("sendgrid")).toBeUndefined();
      expect(await loadProvider("resend")).toBeUndefined();
      expect(mockSendgridImport).not.toHaveBeenCalled();
      expect(mockResendImport).not.toHaveBeenCalled();
    });
  });

  it("does not late-load providers when API key is set after first call", async () => {
    await jest.isolateModulesAsync(async () => {
      const { loadProvider } = await import("../send");
      const first = await loadProvider("sendgrid");
      process.env.SENDGRID_API_KEY = "sg";
      const second = await loadProvider("sendgrid");
      expect(first).toBeUndefined();
      expect(second).toBeUndefined();
    });
    expect(SendgridProvider).not.toHaveBeenCalled();
    expect(mockSendgridImport).not.toHaveBeenCalled();
  });

  it("does not late-load Resend provider when API key is set after first call", async () => {
    await jest.isolateModulesAsync(async () => {
      const { loadProvider } = await import("../send");
      const first = await loadProvider("resend");
      process.env.RESEND_API_KEY = "rs";
      const second = await loadProvider("resend");
      expect(first).toBeUndefined();
      expect(second).toBeUndefined();
    });
    expect(ResendProvider).not.toHaveBeenCalled();
    expect(mockResendImport).not.toHaveBeenCalled();
  });

  it("caches unknown providers as undefined", async () => {
    await jest.isolateModulesAsync(async () => {
      const { loadProvider } = await import("../send");
      const first = await loadProvider("custom");
      const second = await loadProvider("custom");
      expect(first).toBeUndefined();
      expect(second).toBeUndefined();
      expect(mockSendgridImport).not.toHaveBeenCalled();
      expect(mockResendImport).not.toHaveBeenCalled();
    });
  });
});

