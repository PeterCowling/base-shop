import { parseShopForm } from "../validation";

describe("validation service", () => {
  it("parses a valid shop form", () => {
    const formData = new FormData();
    formData.set("id", "1");
    formData.set("name", "My Shop");
    formData.set("themeId", "theme1");
    const result = parseShopForm(formData);
    expect(result.data?.id).toBe("1");
  });

  it("returns errors for invalid shop form", () => {
    const formData = new FormData();
    const result = parseShopForm(formData);
    expect(result.errors).toBeDefined();
  });
});
