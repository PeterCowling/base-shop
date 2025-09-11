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
  const entriesFn = fd.entries;
  if (typeof entriesFn === "function") {
    return entriesFn.call(fd);
  }

  const iteratorFn = fd[Symbol.iterator];
  if (typeof iteratorFn === "function") {
    return iteratorFn.call(fd);
  }

  const entries: [string, FormDataEntryValue][] = [];
  const forEachFn = fd.forEach;
  if (typeof forEachFn === "function") {
    forEachFn.call(fd, (value: FormDataEntryValue, key: string) => {
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

export function tryJsonParse<T>(
  value: FormDataEntryValue | null,
): T | undefined {
  if (typeof value !== "string") return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}
