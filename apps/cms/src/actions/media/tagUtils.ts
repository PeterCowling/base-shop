// apps/cms/src/actions/media/tagUtils.ts

export function cleanTagsList(tags: Iterable<string>): string[] {
  const seen = new Set<string>();
  for (const tag of tags) {
    if (typeof tag !== "string") continue;
    const trimmed = tag.trim();
    if (trimmed) seen.add(trimmed);
  }
  return Array.from(seen);
}

export function parseTagsString(value: string): string[] {
  if (!value) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    parsed = undefined;
  }

  if (Array.isArray(parsed)) {
    return cleanTagsList(
      parsed.filter((tag): tag is string => typeof tag === "string")
    );
  }

  if (typeof parsed === "string") {
    return cleanTagsList([parsed]);
  }

  return cleanTagsList(value.split(/[,\n]/));
}

export function extractTagsFromFormData(
  formData: FormData
): string[] | undefined {
  const keys = ["tags", "tags[]"];
  const collected: string[] = [];
  let seen = false;

  for (const key of keys) {
    const entries = formData.getAll(key);
    if (entries.length > 0) {
      seen = true;
    }

    for (const entry of entries) {
      if (typeof entry !== "string") continue;
      collected.push(...parseTagsString(entry));
    }
  }

  if (!seen) return undefined;
  const cleaned = cleanTagsList(collected);
  return cleaned.length ? cleaned : [];
}

export function normalizeTagsForStorage(
  tags: string[] | null | undefined
): string[] | undefined {
  if (tags === undefined) {
    return undefined;
  }
  if (tags === null) {
    return [];
  }
  const cleaned = cleanTagsList(tags);
  return cleaned.length ? cleaned : [];
}

export function normalizeTagsInput(value: unknown): string[] | undefined {
  if (value == null) return undefined;

  if (Array.isArray(value)) {
    const cleaned = cleanTagsList(
      value.filter((tag): tag is string => typeof tag === "string")
    );
    return cleaned.length ? cleaned : undefined;
  }

  if (typeof value === "string") {
    const cleaned = parseTagsString(value);
    return cleaned.length ? cleaned : undefined;
  }

  return undefined;
}
