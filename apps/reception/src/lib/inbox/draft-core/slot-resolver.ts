export function resolveSlots(
  body: string,
  slots: Record<string, string | null | undefined>,
): string {
  return body.replace(/\{\{SLOT:([A-Z_]+)\}\}/g, (_match, key: string) => {
    const value = slots[key];
    return value != null ? value : "";
  });
}
