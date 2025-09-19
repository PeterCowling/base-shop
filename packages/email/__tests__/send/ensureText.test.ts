import { ensureText } from "../../src/send";

describe("ensureText", () => {
  it("throws when html is missing", () => {
    expect(() => ensureText({ to: "a", subject: "b" })).toThrow(
      "Missing html content for campaign email"
    );
  });

  it("appends derived text when missing", () => {
    const options = ensureText({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hello&nbsp;world</p>",
    });
    expect(options.text).toBe("Hello world");
  });
});
