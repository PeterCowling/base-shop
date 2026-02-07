export function deriveShopFromPath(): string | undefined {
  try {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const parts = path.split("/").filter(Boolean);
    const i = parts.findIndex((p) => p === "shop");
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch {}
  return undefined;
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function notify(detail: { type: "success" | "error" | "info"; title: string; message?: string }) {
  try {
    window.dispatchEvent(new CustomEvent("pb:notify", { detail }));
  } catch {}
}

