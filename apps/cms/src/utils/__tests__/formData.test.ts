import { formDataEntries, formDataToObject, tryJsonParse } from "../formData";

describe("formDataEntries", () => {
  it("uses entries when available", () => {
    const entries: [string, FormDataEntryValue][] = [
      ["foo", "bar"],
      ["baz", "qux"],
    ];
    const entriesMock = jest.fn(() => entries);
    const fd = { entries: entriesMock } as unknown as FormData;

    expect(Array.from(formDataEntries(fd))).toEqual(entries);
    expect(entriesMock).toHaveBeenCalledTimes(1);
  });

  it("uses iterator when entries are missing", () => {
    const fd = {
      [Symbol.iterator]: function* () {
        yield ["foo", "bar"] as [string, FormDataEntryValue];
        yield ["baz", "qux"] as [string, FormDataEntryValue];
      },
    } as unknown as FormData;

    expect(Array.from(formDataEntries(fd))).toEqual([
      ["foo", "bar"],
      ["baz", "qux"],
    ]);
  });

  it("falls back to forEach when only forEach exists", () => {
    const entries: [string, FormDataEntryValue][] = [
      ["alpha", "1"],
      ["beta", "2"],
    ];
    const fd = {
      forEach: (callback: (value: FormDataEntryValue, key: string) => void) => {
        entries.forEach(([key, value]) => callback(value, key));
      },
    } as unknown as FormData;

    expect(Array.from(formDataEntries(fd))).toEqual(entries);
  });

  it("converts FormData to object", () => {
    const fd = { entries: () => [["foo", "bar"]] } as unknown as FormData;
    expect(formDataToObject(fd as FormData)).toEqual({ foo: "bar" });
  });
});

describe("tryJsonParse", () => {
  it("parses valid JSON strings", () => {
    expect(tryJsonParse<{ foo: string }>("{\"foo\":\"bar\"}")).toEqual({
      foo: "bar",
    });
  });

  it("returns undefined for invalid JSON strings", () => {
    expect(tryJsonParse("not json")).toBeUndefined();
  });

  it("returns undefined for non-string values", () => {
    expect(tryJsonParse<{ foo: string }>(null)).toBeUndefined();
    expect(
      tryJsonParse<{ foo: string }>(new File([], "file.txt")),
    ).toBeUndefined();
  });
});

