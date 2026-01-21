
import { getLoanIconClass, getLoanTitle } from "../CheckoutTable";
import { formatDdMm } from "../../../utils/dateUtils";

describe("formatDdMm", () => {
  it("formats ISO date to DD/MM", () => {
    expect(formatDdMm("2023-02-05")).toBe("05/02");
  });

  it("returns empty string for falsy input", () => {
    expect(formatDdMm("")).toBe("");
  });
});

describe("getLoanIconClass", () => {
  it("returns correct icon for Umbrella", () => {
    expect(getLoanIconClass("Umbrella")).toBe(
      "fas fa-umbrella fa-lg text-blue-600"
    );
  });

  it("returns keycard cash icon", () => {
    expect(getLoanIconClass("Keycard", "cash")).toBe(
      "fas fa-id-card fa-lg text-green-600"
    );
  });

  it("returns keycard document icon", () => {
    expect(getLoanIconClass("Keycard", "passport")).toBe(
      "fas fa-id-card fa-lg text-yellow-600"
    );
  });

  it("warns on unknown keycard deposit", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(getLoanIconClass("Keycard")).toBe(
      "fas fa-id-card fa-lg text-gray-700"
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
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
