// src/routes/assistance/resolveCanonicalPath.ts
type PathArgs = {
  fallbackPath: string;
  locationPathname?: string | null;
};

const normalise = (value: string | undefined | null): string | undefined => {
  if (!value) return undefined;
  const withLeading = value.startsWith("/") ? value : `/${value}`;
  if (withLeading === "/") return withLeading;
  return withLeading.endsWith("/") ? withLeading.slice(0, -1) : withLeading;
};

export function resolveCanonicalAssistancePath({
  fallbackPath,
  locationPathname,
}: PathArgs): string {
  const fallback = normalise(fallbackPath) ?? "/";
  const location = normalise(locationPathname);

  if (!location) {
    return fallback;
  }

  const fallbackSegments = fallback.split("/").filter(Boolean);
  const locationSegments = location.split("/").filter(Boolean);

  if (fallbackSegments.length !== locationSegments.length) {
    return fallback;
  }

  for (let index = 0; index < fallbackSegments.length; index += 1) {
    if (fallbackSegments[index] !== locationSegments[index]) {
      return fallback;
    }
  }

  return location;
}

