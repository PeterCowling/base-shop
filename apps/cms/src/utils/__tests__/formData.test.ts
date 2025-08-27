import { formDataEntries, formDataToObject } from "../formData";

describe("formData helpers", () => {
  it("uses iterator when available", () => {
    const iteratorFormData = {
      [Symbol.iterator]: function* () {
        yield ["foo", "bar"] as [string, FormDataEntryValue];
        yield ["baz", "qux"] as [string, FormDataEntryValue];
      },
    } as unknown as FormData;

    expect(Array.from(formDataEntries(iteratorFormData))).toEqual([
      ["foo", "bar"],
      ["baz", "qux"],
    ]);
    expect(formDataToObject(iteratorFormData)).toEqual({
      foo: "bar",
      baz: "qux",
    });
  });

  it("falls back to forEach when iterator missing", () => {
    const entries: [string, FormDataEntryValue][] = [
      ["alpha", "1"],
      ["beta", "2"],
    ];
    const forEachFormData = {
      forEach: (callback: (value: FormDataEntryValue, key: string) => void) => {
        entries.forEach(([key, value]) => callback(value, key));
      },
    } as unknown as FormData;

    expect(Array.from(formDataEntries(forEachFormData))).toEqual(entries);
    expect(formDataToObject(forEachFormData)).toEqual({
      alpha: "1",
      beta: "2",
    });
  });
});
