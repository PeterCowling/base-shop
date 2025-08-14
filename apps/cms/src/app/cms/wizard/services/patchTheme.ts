"use client";

export async function patchTheme(
  shopId: string,
  data: {
    themeOverrides?: Record<string, string | null>;
    themeDefaults?: Record<string, string>;
  },
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/cms/api/configurator", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: shopId, ...data }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
  };
  if (res.ok && json.success) {
    return { ok: true };
  }
  return { ok: false, error: json.error ?? "Failed to update theme" };
}
