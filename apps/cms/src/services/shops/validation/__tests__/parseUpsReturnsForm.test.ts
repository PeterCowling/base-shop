import { parseUpsReturnsForm } from "../parseUpsReturnsForm";

describe("parseUpsReturnsForm", () => {
  it("converts checkboxes", () => {
    const fd = new FormData();
    fd.set("enabled", "on");

    const result = parseUpsReturnsForm(fd);
    expect(result.data).toEqual({ enabled: true });
  });

  it("parses all booleans when present", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("bagEnabled", "on");
    fd.set("homePickupEnabled", "on");

    const result = parseUpsReturnsForm(fd);
    expect(result.data).toEqual({
      enabled: true,
      bagEnabled: true,
      homePickupEnabled: true,
    });
  });

  it("errors on invalid checkbox values", () => {
    const fd = new FormData();
    fd.set("enabled", "yes");

    const result = parseUpsReturnsForm(fd);
    expect(result.errors?.enabled).toBeTruthy();
  });
});
