import { jest } from "@jest/globals";

jest.mock("@sendgrid/mail", () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: jest.fn(),
    client: { request: jest.fn() },
  },
}));

jest.mock("resend", () => ({
  Resend: jest.fn(),
}));

const sgMail = require("@sendgrid/mail").default;
const { Resend } = require("resend");
const resendContacts = {
  create: jest.fn(),
  update: jest.fn(),
  list: jest.fn(),
};
(Resend as jest.Mock).mockImplementation(() => ({ contacts: resendContacts, emails: { send: jest.fn() } }));

describe("Campaign providers segmentation", () => {
  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_PROVIDER;
  });

  describe("SendgridProvider", () => {
    it("supports contact and segment APIs", async () => {
      process.env.SENDGRID_API_KEY = "sg";
      const { SendgridProvider } = await import("../providers/sendgrid");
      const provider = new SendgridProvider();

      (sgMail.client.request as jest.Mock)
        .mockResolvedValueOnce([{ statusCode: 202 }, {}])
        .mockResolvedValueOnce([{ statusCode: 200 }, { result: [{ id: "123" }] }]);

      const contactId = await provider.createContact("user@example.com");
      expect(sgMail.client.request).toHaveBeenNthCalledWith(1, {
        method: "PUT",
        url: "/v3/marketing/contacts",
        body: { contacts: [{ email: "user@example.com" }] },
      });
      expect(sgMail.client.request).toHaveBeenNthCalledWith(2, {
        method: "POST",
        url: "/v3/marketing/contacts/search",
        body: { query: "email LIKE 'user@example.com'" },
      });
      expect(contactId).toBe("123");

      await provider.addToList("user@example.com", "list1");
      expect(sgMail.client.request).toHaveBeenNthCalledWith(3, {
        method: "PUT",
        url: "/v3/marketing/contacts",
        body: {
          list_ids: ["list1"],
          contacts: [{ email: "user@example.com" }],
        },
      });

      (sgMail.client.request as jest.Mock).mockResolvedValueOnce([
        { statusCode: 200 },
        { result: [{ email: "a@example.com" }] },
      ]);
      const emails = await provider.listSegments("seg1");
      expect(sgMail.client.request).toHaveBeenNthCalledWith(4, {
        method: "GET",
        url: "/v3/marketing/segments/seg1/contacts",
      });
      expect(emails).toEqual(["a@example.com"]);
    });
  });

  describe("ResendProvider", () => {
    it("supports contact and segment APIs", async () => {
      process.env.RESEND_API_KEY = "rs";
      const { ResendProvider } = await import("../providers/resend");
      const provider = new ResendProvider();

      resendContacts.create.mockResolvedValue({ data: { id: "abc" } });
      const contactId = await provider.createContact("a@example.com");
      expect(resendContacts.create).toHaveBeenCalledWith({ email: "a@example.com" });
      expect(contactId).toBe("abc");

      await provider.addToList("a@example.com", "list-1");
      expect(resendContacts.update).toHaveBeenCalledWith({
        id: "a@example.com",
        audienceId: "list-1",
      });

      resendContacts.list.mockResolvedValue({
        data: { data: [{ email: "a@example.com" }, { email: "b@example.com" }] },
      });
      const emails = await provider.listSegments("list-1");
      expect(resendContacts.list).toHaveBeenCalledWith({ audienceId: "list-1" });
      expect(emails).toEqual(["a@example.com", "b@example.com"]);
    });
  });

  describe("resolveSegment", () => {
    it("uses provider listSegments when available", async () => {
      jest.resetModules();
      process.env.EMAIL_PROVIDER = "sendgrid";
      const listSegmentsMock = jest.fn().mockResolvedValue(["x@example.com"]);
      jest.doMock("../providers/sendgrid", () => ({
        SendgridProvider: jest.fn().mockImplementation(() => ({
          listSegments: listSegmentsMock,
        })),
      }));
      const { resolveSegment } = await import("../segments");
      const emails = await resolveSegment("shop", "seg");
      expect(listSegmentsMock).toHaveBeenCalledWith("seg");
      expect(emails).toEqual(["x@example.com"]);
    });
  });
});

