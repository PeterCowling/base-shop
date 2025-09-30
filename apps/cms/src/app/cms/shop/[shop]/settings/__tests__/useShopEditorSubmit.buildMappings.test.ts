import { buildNumberMapping, buildStringMapping } from "../useShopEditorSubmit";

describe("useShopEditorSubmit — build mappings", () => {
  it("builds mapping objects", () => {
    expect(buildStringMapping([{ key: " a ", value: " b " }])).toEqual({
      a: "b",
    });
    expect(buildNumberMapping([{ key: "en", value: "10" }])).toEqual({
      en: 10,
    });
  });
});

