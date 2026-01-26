import { serializeJsonLd } from "../seo/serializeJsonLd";

describe("serializeJsonLd", () => {
  it("escapes script-breaking characters", () => {
    const payload = {
      name: "Example </script>",
      note: "Line\u2028Separator\u2029Test",
    };
    const serialized = serializeJsonLd(payload);
    expect(serialized).toContain("\\u003c");
    expect(serialized).toContain("\\u003e");
    expect(serialized).toContain("\\u2028");
    expect(serialized).toContain("\\u2029");
  });
});
