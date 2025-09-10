import { parseAiCatalogForm } from "../parseAiCatalogForm";

describe("parseAiCatalogForm", () => {
  it("parses valid form data", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("pageSize", "20");
    fd.append("fields", "id");
    fd.append("fields", "title");

    const result = parseAiCatalogForm(fd);
    expect(result.data).toEqual({
      enabled: true,
      pageSize: 20,
      fields: ["id", "title"],
    });
  });

  it("returns errors for invalid inputs", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("pageSize", "0");
    fd.append("fields", "invalid");

    const result = parseAiCatalogForm(fd);
    expect(result.errors).toEqual({
      pageSize: [expect.any(String)],
      fields: [expect.any(String)],
    });
  });
});
