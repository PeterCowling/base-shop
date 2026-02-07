import { createSendgridTestHarness } from "../../__tests__/sendgrid/setup";

jest.mock("@sendgrid/mail", () => {
  const setApiKey = jest.fn();
  const send = jest.fn();
  return { __esModule: true, default: { setApiKey, send }, setApiKey, send };
});

describe("SendgridProvider constructor", () => {
  const getSgMail = createSendgridTestHarness();

  it("sets API key when provided", async () => {
    process.env.SENDGRID_API_KEY = "key";
    const sgMail = getSgMail();
    const { SendgridProvider } = await import("../sendgrid");
    new SendgridProvider();
    expect(sgMail.setApiKey).toHaveBeenCalledWith("key");
  });
});
