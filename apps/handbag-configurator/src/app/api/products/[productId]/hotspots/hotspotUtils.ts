const SAFE_SEGMENT = /^[a-zA-Z0-9._-]+$/;

const toSafeString = (value: unknown) =>
  typeof value === "string" && SAFE_SEGMENT.test(value) ? value : null;

const toOffset = (value: unknown) => {
  if (!value || typeof value !== "object") return null;
  const maybe = value as { x?: unknown; y?: unknown };
  const x = typeof maybe.x === "number" && Number.isFinite(maybe.x) ? maybe.x : 0;
  const y = typeof maybe.y === "number" && Number.isFinite(maybe.y) ? maybe.y : 0;
  return { x, y };
};

export const sanitizeHotspots = (value: unknown) => {
  if (!Array.isArray(value)) return null;
  const cleaned = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const raw = entry as Record<string, unknown>;
    const id = toSafeString(raw["id"]);
    const regionId = toSafeString(raw["regionId"]);
    if (!id || !regionId) continue;
    const label = typeof raw["label"] === "string" ? raw["label"] : undefined;
    const nodeName = toSafeString(raw["nodeName"]) ?? undefined;
    const focusTargetNode = toSafeString(raw["focusTargetNode"]) ?? undefined;
    const offset = toOffset(raw["offset"]) ?? undefined;
    const propertyKeys = Array.isArray(raw["propertyKeys"])
      ? raw["propertyKeys"].filter((item) => typeof item === "string")
      : undefined;
    cleaned.push({
      id,
      regionId,
      ...(label ? { label } : {}),
      ...(nodeName ? { nodeName } : {}),
      ...(focusTargetNode ? { focusTargetNode } : {}),
      ...(offset ? { offset } : {}),
      ...(propertyKeys ? { propertyKeys } : {}),
    });
  }
  return cleaned;
};

export { SAFE_SEGMENT };
