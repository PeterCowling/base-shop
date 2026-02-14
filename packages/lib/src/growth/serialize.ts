export interface CanonicalJsonOptions {
  indent?: number;
  trailingNewline?: boolean;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }

  if (value !== null && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const key of Object.keys(input).sort()) {
      output[key] = canonicalize(input[key]);
    }

    return output;
  }

  return value;
}

export function canonicalSerializeJson(
  value: unknown,
  options: CanonicalJsonOptions = {},
): string {
  const { indent = 2, trailingNewline = true } = options;
  const serialized = JSON.stringify(canonicalize(value), null, indent);
  return trailingNewline ? `${serialized}\n` : serialized;
}

