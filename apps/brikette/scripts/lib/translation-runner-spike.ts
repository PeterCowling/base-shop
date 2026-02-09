type TranslationTokenType = "LINK" | "IMAGE" | "COMPONENT";

const TOKEN_PATTERN = /%(LINK|IMAGE|COMPONENT):([^%]+?)%/g;

export type TranslationProviderInput = {
  text: string;
  locale: string;
  context: {
    guideName: string;
    sourceLocale: string;
    tokenPolicyVersion: "v1";
  };
};

export interface TranslationProvider {
  id: string;
  translate: (input: TranslationProviderInput) => Promise<string>;
}

export type TranslationSpikeErrorCode =
  | "provider_error"
  | "invalid_source_json"
  | "invalid_translated_json"
  | "token_invariant_mismatch";

export class TranslationSpikeError extends Error {
  readonly code: TranslationSpikeErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: TranslationSpikeErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export type TranslationSpikeOptions = {
  provider: TranslationProvider;
  sourceJson: string;
  targetLocale: string;
  guideName: string;
  sourceLocale?: string;
};

export type TranslationSpikeResult = {
  providerId: string;
  targetLocale: string;
  guideName: string;
  translatedText: string;
  translatedJson: unknown;
  tokenSignatures: string[];
};

const collectStringLeaves = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStringLeaves);
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectStringLeaves);
  }

  return [];
};

const toTokenSignature = (
  tokenType: TranslationTokenType,
  rawPayload: string,
): string => {
  const trimmedPayload = rawPayload.trim();
  if (tokenType === "COMPONENT") {
    return `COMPONENT:${trimmedPayload}`;
  }

  const invariantSegment = trimmedPayload.split("|", 1)[0]?.trim() ?? "";
  return `${tokenType}:${invariantSegment}`;
};

const collectTokenSignatures = (value: unknown): string[] => {
  const signatures: string[] = [];

  for (const text of collectStringLeaves(value)) {
    TOKEN_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TOKEN_PATTERN.exec(text)) !== null) {
      const tokenType = match[1] as TranslationTokenType;
      const rawPayload = match[2] ?? "";
      signatures.push(toTokenSignature(tokenType, rawPayload));
    }
  }

  return signatures.sort();
};

const toSignatureCountMap = (signatures: readonly string[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const signature of signatures) {
    counts.set(signature, (counts.get(signature) ?? 0) + 1);
  }
  return counts;
};

const compareSignatureCounts = (
  sourceSignatures: readonly string[],
  translatedSignatures: readonly string[],
): { missing: string[]; extra: string[] } => {
  const missing: string[] = [];
  const extra: string[] = [];
  const sourceCounts = toSignatureCountMap(sourceSignatures);
  const translatedCounts = toSignatureCountMap(translatedSignatures);
  const allKeys = new Set([
    ...sourceCounts.keys(),
    ...translatedCounts.keys(),
  ]);

  for (const signature of allKeys) {
    const sourceCount = sourceCounts.get(signature) ?? 0;
    const translatedCount = translatedCounts.get(signature) ?? 0;
    const delta = translatedCount - sourceCount;
    if (delta > 0) {
      extra.push(`${signature} (+${delta})`);
    } else if (delta < 0) {
      missing.push(`${signature} (${delta})`);
    }
  }

  return {
    missing: missing.sort(),
    extra: extra.sort(),
  };
};

const parseJsonOrThrow = (
  raw: string,
  errorCode: "invalid_source_json" | "invalid_translated_json",
): unknown => {
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new TranslationSpikeError(errorCode, `${errorCode}: JSON parse failed`, {
      cause: error instanceof Error ? error.message : String(error),
    });
  }
};

export async function runTranslationSpike(
  options: TranslationSpikeOptions,
): Promise<TranslationSpikeResult> {
  const sourceLocale = options.sourceLocale ?? "en";
  const sourceJson = parseJsonOrThrow(options.sourceJson, "invalid_source_json");

  let translatedText: string;
  try {
    translatedText = await options.provider.translate({
      text: options.sourceJson,
      locale: options.targetLocale,
      context: {
        guideName: options.guideName,
        sourceLocale,
        tokenPolicyVersion: "v1",
      },
    });
  } catch (error) {
    throw new TranslationSpikeError("provider_error", "provider_error: provider invocation failed", {
      cause: error instanceof Error ? error.message : String(error),
      providerId: options.provider.id,
      locale: options.targetLocale,
      guideName: options.guideName,
    });
  }

  const translatedJson = parseJsonOrThrow(translatedText, "invalid_translated_json");
  const sourceTokenSignatures = collectTokenSignatures(sourceJson);
  const translatedTokenSignatures = collectTokenSignatures(translatedJson);
  const tokenDelta = compareSignatureCounts(sourceTokenSignatures, translatedTokenSignatures);

  if (tokenDelta.missing.length > 0 || tokenDelta.extra.length > 0) {
    throw new TranslationSpikeError("token_invariant_mismatch", "token_invariant_mismatch: token signatures changed", {
      missing: tokenDelta.missing,
      extra: tokenDelta.extra,
      providerId: options.provider.id,
      locale: options.targetLocale,
      guideName: options.guideName,
    });
  }

  return {
    providerId: options.provider.id,
    targetLocale: options.targetLocale,
    guideName: options.guideName,
    translatedText,
    translatedJson,
    tokenSignatures: translatedTokenSignatures,
  };
}

export type FixtureTranslationProviderMap = Readonly<Record<string, string>>;

export function createFixtureTranslationProvider(
  fixtures: FixtureTranslationProviderMap,
): TranslationProvider {
  return {
    id: "fixture-provider",
    async translate({ locale, context }) {
      const exactFixtureKey = `${locale}:${context.guideName}`;
      if (fixtures[exactFixtureKey]) {
        return fixtures[exactFixtureKey];
      }

      const wildcardFixtureKey = `${locale}:*`;
      if (fixtures[wildcardFixtureKey]) {
        return fixtures[wildcardFixtureKey];
      }

      throw new Error(`Missing fixture for ${exactFixtureKey}`);
    },
  };
}
