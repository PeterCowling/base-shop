interface FormDataLike {
  entries?: () => Iterable<[string, FormDataEntryValue]>;
  [Symbol.iterator]?: () => IterableIterator<[string, FormDataEntryValue]>;
  forEach?: (
    callback: (value: FormDataEntryValue, key: string) => void,
  ) => void;
}

export function formDataEntries(
  formData: FormData,
): Iterable<[string, FormDataEntryValue]> {
  const fd = formData as unknown as FormDataLike;
  if (typeof fd.entries === "function") {
    return fd.entries();
  }
  if (typeof fd[Symbol.iterator] === "function") {
    return fd[Symbol.iterator]!();
  }
  const entries: [string, FormDataEntryValue][] = [];
  if (typeof fd.forEach === "function") {
    fd.forEach((value: FormDataEntryValue, key: string) => {
      entries.push([key, value]);
    });
  }
  return entries;
}

export function formDataToObject(
  formData: FormData,
): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formDataEntries(formData));
}
