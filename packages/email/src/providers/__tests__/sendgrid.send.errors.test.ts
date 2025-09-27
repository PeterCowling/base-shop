jest.mock("@sendgrid/mail", () => {
  const setApiKey = jest.fn();
  const send = jest.fn();
  return { __esModule: true, default: { setApiKey, send }, setApiKey, send };
});

import { createSendgridTestHarness } from "../../__tests__/sendgrid/setup";

describe("SendgridProvider send – error handling", () => {
  const getSgMail = createSendgridTestHarness();

  const options = {
    to: "to@example.com",
    subject: "Subject",
    html: "<p>HTML</p>",
    text: "Text",
  };

  it("wraps 400 errors as non-retryable ProviderError", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = getSgMail();
    const err = Object.assign(new Error("Bad Request"), { code: 400 });
    sgMail.send.mockRejectedValueOnce(err);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "Bad Request",
      retryable: false,
    });
  });

  it("marks 500 errors as retryable", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = getSgMail();
    const err = Object.assign(new Error("Server Error"), { code: 500 });
    sgMail.send.mockRejectedValueOnce(err);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({ retryable: true });
  });

  it("treats standard Error as retryable", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = getSgMail();
    const err = new Error("network fail");
    sgMail.send.mockRejectedValueOnce(err);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "network fail",
      retryable: true,
    });
  });

  it("wraps unexpected errors in ProviderError", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = getSgMail();
    sgMail.send.mockRejectedValueOnce("boom");
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "Unknown error",
      retryable: true,
    });
  });

  it("parses string status codes", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = getSgMail();
    const err = Object.assign(new Error("Upstream"), { status: "502" });
    sgMail.send.mockRejectedValueOnce(err);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({ retryable: true });
  });
});
