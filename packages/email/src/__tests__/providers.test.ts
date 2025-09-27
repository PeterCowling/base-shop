import { hasProviderErrorFields } from "../providers/error";

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("@sendgrid/mail", () => ({
  __esModule: true,
  default: { setApiKey: jest.fn(), send: jest.fn() },
}));

describe("Campaign providers segmentation", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({}) })
    );
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_MARKETING_KEY;
    delete process.env.RESEND_API_KEY;
  });

  it("sendgrid segmentation methods call API", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.SENDGRID_MARKETING_KEY = "smk";
    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    // createContact
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ persisted_recipients: ["c1"] }),
    });
    const id = await provider.createContact!("user@example.com");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/marketing/contacts",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({ Authorization: "Bearer smk" }),
      })
    );
    expect(id).toBe("c1");

    // addToList
    (fetch as jest.Mock).mockResolvedValueOnce({ json: () => Promise.resolve({}) });
    await provider.addToList!("c1", "l1");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/marketing/lists/l1/contacts",
      expect.objectContaining({ method: "PUT" })
    );

    // listSegments
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ result: [{ id: "s1", name: "Seg" }] }),
    });
    const segs = await provider.listSegments!();
    expect(fetch).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/marketing/segments",
      expect.any(Object)
    );
    expect(segs).toEqual([{ id: "s1", name: "Seg" }]);
  });

  it("resend segmentation methods call API", async () => {
    process.env.RESEND_API_KEY = "rs";
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();

    // createContact
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ id: "c2" }),
    });
    const id = await provider.createContact!("user@example.com");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.resend.com/contacts",
      expect.objectContaining({ method: "POST" })
    );
    expect(id).toBe("c2");

    // addToList
    (fetch as jest.Mock).mockResolvedValueOnce({ json: () => Promise.resolve({}) });
    await provider.addToList!("c2", "l2");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.resend.com/segments/l2/contacts",
      expect.objectContaining({ method: "POST" })
    );

    // listSegments
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ data: [{ id: "s2", name: "Seg2" }] }),
    });
    const segs = await provider.listSegments!();
    expect(fetch).toHaveBeenCalledWith(
      "https://api.resend.com/segments",
      expect.any(Object)
    );
    expect(segs).toEqual([{ id: "s2", name: "Seg2" }]);
  });
});

describe("hasProviderErrorFields", () => {
  it("returns true for plain objects", () => {
    expect(hasProviderErrorFields({})).toBe(true);
  });

  it("returns false for null, numbers, and strings", () => {
    for (const value of [null, 123, "abc"] as const) {
      expect(hasProviderErrorFields(value)).toBe(false);
    }
  });
});
