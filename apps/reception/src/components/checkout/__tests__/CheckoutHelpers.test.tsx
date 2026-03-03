
import { formatDdMm } from "../../../utils/dateUtils";
import { getLoanIcon, getLoanTitle } from "../CheckoutTable";

describe("formatDdMm", () => {
  it("formats ISO date to DD/MM", () => {
    expect(formatDdMm("2023-02-05")).toBe("05/02");
  });

  it("returns empty string for falsy input", () => {
    expect(formatDdMm("")).toBe("");
  });
});

describe("getLoanIcon", () => {
  it("returns correct color class for Umbrella", () => {
    const { colorClass } = getLoanIcon("Umbrella");
    expect(colorClass).toBe("text-primary-main");
  });

  it("returns correct color class for keycard with cash deposit", () => {
    const { colorClass } = getLoanIcon("Keycard", "cash");
    expect(colorClass).toBe("text-success-main");
  });

  it("returns correct color class for keycard with document deposit", () => {
    const { colorClass } = getLoanIcon("Keycard", "passport");
    expect(colorClass).toBe("text-warning-main");
  });

  it("warns and returns fallback for unknown keycard deposit", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const { colorClass } = getLoanIcon("Keycard");
    expect(colorClass).toBe("text-foreground");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("returns a valid Icon component", () => {
    const { Icon } = getLoanIcon("Umbrella");
    expect(typeof Icon).toBe("function");
  });
});

describe("getLoanTitle", () => {
  it("returns item when not keycard", () => {
    expect(getLoanTitle("Padlock")).toBe("Padlock");
  });

  it("returns title for keycard with cash", () => {
    expect(getLoanTitle("Keycard", "cash")).toBe("Keycard with cash");
  });

  it("returns title for keycard with document", () => {
    expect(getLoanTitle("Keycard", "passport")).toBe("Keycard with document");
  });

  it("warns and defaults for unknown keycard deposit", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(getLoanTitle("Keycard")).toBe("Keycard");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
