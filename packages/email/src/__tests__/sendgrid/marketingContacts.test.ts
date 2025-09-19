import { createSendgridTestHarness } from "./setup";

createSendgridTestHarness();

describe("SendgridProvider createContact", () => {
  it("returns new contact id on success", async () => {
    process.env.SENDGRID_MARKETING_KEY = "sg";
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ persisted_recipients: ["abc"] }),
    });
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.createContact("user@example.com")).resolves.toBe("abc");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/marketing/contacts",
      expect.anything(),
    );
  });

  it("returns empty string without marketing key", async () => {
    global.fetch = jest.fn();
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.createContact("user@example.com")).resolves.toBe("");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns empty string on fetch failure", async () => {
    process.env.SENDGRID_MARKETING_KEY = "sg";
    global.fetch = jest.fn().mockRejectedValue(new Error("fail"));
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.createContact("user@example.com")).resolves.toBe("");
  });

  it("returns empty string when persisted recipients empty", async () => {
    process.env.SENDGRID_MARKETING_KEY = "sg";
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ persisted_recipients: [] }),
    });
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.createContact("user@example.com")).resolves.toBe("");
  });

  it("returns empty string when persisted recipients missing", async () => {
    process.env.SENDGRID_MARKETING_KEY = "sg";
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({}),
    });
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.createContact("user@example.com")).resolves.toBe("");
  });
});

describe("SendgridProvider addToList", () => {
  it("adds contact to list on success", async () => {
    process.env.SENDGRID_MARKETING_KEY = "sg";
    const fetchMock = jest.fn().mockResolvedValue({});
    global.fetch = fetchMock;
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/marketing/lists/lid/contacts",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("uses marketing key when present", async () => {
    process.env.SENDGRID_MARKETING_KEY = "mk";
    const fetchMock = jest.fn().mockResolvedValue({});
    global.fetch = fetchMock;
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/marketing/lists/lid/contacts",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("does nothing without marketing key", async () => {
    global.fetch = jest.fn();
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("resolves even when fetch fails", async () => {
    process.env.SENDGRID_MARKETING_KEY = "sg";
    global.fetch = jest.fn().mockRejectedValue(new Error("fail"));
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
  });
});
