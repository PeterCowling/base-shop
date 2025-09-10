import { parseReverseLogisticsForm } from "../parseReverseLogisticsForm";

describe("parseReverseLogisticsForm", () => {
  it("parses valid data", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("intervalMinutes", "10");

    const result = parseReverseLogisticsForm(fd);
    expect(result.data).toEqual({ enabled: true, intervalMinutes: 10 });
  });

  it("returns errors for invalid interval", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("intervalMinutes", "0");

    const result = parseReverseLogisticsForm(fd);
    expect(result.errors).toEqual({
      intervalMinutes: [expect.any(String)],
    });
  });
});
