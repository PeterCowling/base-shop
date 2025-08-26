export function formDataEntries(
  formData: FormData,
): Iterable<[string, FormDataEntryValue]> {
  if (typeof (formData as any).entries === "function") {
    return (formData as any).entries();
  }
  if (typeof (formData as any)[Symbol.iterator] === "function") {
    return (formData as any)[Symbol.iterator]();
  }
  const entries: [string, FormDataEntryValue][] = [];
  if (typeof (formData as any).forEach === "function") {
    (formData as any).forEach((value: FormDataEntryValue, key: string) => {
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
