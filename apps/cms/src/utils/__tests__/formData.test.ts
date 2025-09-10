import { formDataEntries, formDataToObject } from "../formData";

describe("formData helpers", () => {
  it("uses entries when available", () => {
    const entries: [string, FormDataEntryValue][] = [
      ["foo", "bar"],
      ["baz", "qux"],
    ];
    const entriesMock = jest.fn(() => entries);
    const entriesFormData = {
      entries: entriesMock,
    } as unknown as FormData;

    expect(Array.from(formDataEntries(entriesFormData))).toEqual(entries);
    expect(formDataToObject(entriesFormData)).toEqual({
      foo: "bar",
      baz: "qux",
    });
    expect(entriesMock).toHaveBeenCalledTimes(2);
  });

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

  it("returns empty array when no iterable methods are present", () => {
    const emptyFormData = {} as unknown as FormData;

    expect(Array.from(formDataEntries(emptyFormData))).toEqual([]);
  });
});
