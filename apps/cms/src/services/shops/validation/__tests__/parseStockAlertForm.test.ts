import { parseStockAlertForm } from "../parseStockAlertForm";

describe("parseStockAlertForm", () => {
  it("parses recipients", () => {
    const fd = new FormData();
    fd.set("recipients", "a@example.com,b@example.com , ");
    fd.set("threshold", "1");

    const result = parseStockAlertForm(fd);
    expect(result.data).toEqual({
      recipients: ["a@example.com", "b@example.com"],
      threshold: 1,
      webhook: undefined,
    });
  });

  it("parses recipients appended as array values", () => {
    const fd = new FormData();
    fd.append("recipients", "a@example.com");
    fd.append("recipients", "b@example.com ");
    fd.set("threshold", "2");

    const result = parseStockAlertForm(fd);
    expect(result.data).toEqual({
      recipients: ["a@example.com", "b@example.com"],
      threshold: 2,
      webhook: undefined,
    });
  });

  it("handles optional webhook", () => {
    const fd = new FormData();
    fd.set("recipients", "a@example.com");
    fd.set("threshold", "1");
    fd.set("webhook", "https://hook");
    const result = parseStockAlertForm(fd);
    expect(result.data?.webhook).toBe("https://hook");

    const fd2 = new FormData();
    fd2.set("recipients", "a@example.com");
    fd2.set("threshold", "1");
    const result2 = parseStockAlertForm(fd2);
    expect(result2.data?.webhook).toBeUndefined();
  });

  it("validates threshold", () => {
    const fd = new FormData();
    fd.set("recipients", "a@example.com");
    fd.set("threshold", "5");
    const result = parseStockAlertForm(fd);
    expect(result.data?.threshold).toBe(5);

    const fdInvalid = new FormData();
    fdInvalid.set("recipients", "a@example.com");
    fdInvalid.set("threshold", "0");
    const resultInvalid = parseStockAlertForm(fdInvalid);
    expect(resultInvalid.errors).toEqual({ threshold: ["Must be at least 1"] });
  });
});
