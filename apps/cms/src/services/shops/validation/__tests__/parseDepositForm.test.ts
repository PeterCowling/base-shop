import { parseDepositForm } from "../parseDepositForm";

describe("parseDepositForm", () => {
  it("converts boolean and number fields", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("intervalMinutes", "5");

    const result = parseDepositForm(fd);
    expect(result.data).toEqual({ enabled: true, intervalMinutes: 5 });
  });

  it("treats missing or off enabled as false", () => {
    const fdMissing = new FormData();
    fdMissing.set("intervalMinutes", "5");
    expect(parseDepositForm(fdMissing).data?.enabled).toBe(false);

    const fdOff = new FormData();
    fdOff.set("enabled", "off");
    fdOff.set("intervalMinutes", "5");
    expect(parseDepositForm(fdOff).data?.enabled).toBe(false);
  });

  it("returns validation errors", () => {
    const fdZero = new FormData();
    fdZero.set("enabled", "on");
    fdZero.set("intervalMinutes", "0");
    const zeroResult = parseDepositForm(fdZero);
    expect(zeroResult.errors).toEqual({ intervalMinutes: ["Must be at least 1"] });

    const fdNaN = new FormData();
    fdNaN.set("enabled", "on");
    fdNaN.set("intervalMinutes", "invalid");
    const nanResult = parseDepositForm(fdNaN);
    expect(nanResult.errors?.intervalMinutes).toBeTruthy();
  });
});
