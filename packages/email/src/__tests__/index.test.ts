import { jest } from "@jest/globals";

const sendEmailMock = jest.fn();

jest.mock("@acme/platform-core/services/emailService", () => ({
  setEmailService: jest.fn(),
}));

jest.mock("../sendEmail", () => ({
  sendEmail: sendEmailMock,
}));

jest.mock("../templates", () => ({
  registerTemplate: jest.fn(),
  renderTemplate: jest.fn(),
  clearTemplates: jest.fn(),
}));

describe("email index", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("registers sendEmail with email service on import", async () => {
    const { setEmailService } = require("@acme/platform-core/services/emailService");

    await import("../index");

    expect(setEmailService).toHaveBeenCalledWith({ sendEmail: sendEmailMock });
  });

  it("re-exports public API", async () => {
    const mod = await import("../index");

    expect(mod.sendCampaignEmail).toBeDefined();
    expect(mod.registerTemplate).toBeDefined();
    expect(mod.recoverAbandonedCarts).toBeDefined();
    expect(mod.sendEmail).toBeDefined();
    expect(mod.resolveSegment).toBeDefined();
    expect(mod.createCampaign).toBeDefined();
  });
});

