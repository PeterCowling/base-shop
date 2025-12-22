import type { TFunction, TOptions } from "i18next";

import {
  FALLBACK_DEALS,
  PLACEHOLDER_TOKEN_REGEX,
  TEMPLATE_TOKEN_REGEX,
} from "./constants";

export type FallbackTranslator = (key: string, options?: TOptions) => string;

export function getFallbackValue(path: string): unknown {
  return path.split(".").reduce<unknown>((acc, segment) => {
    if (acc == null) {
      return undefined;
    }

    if (Array.isArray(acc)) {
      const index = Number(segment);
      return Number.isInteger(index) ? acc[index] : undefined;
    }

    if (typeof acc === "object") {
      return (acc as Record<string, unknown>)[segment];
    }

    return undefined;
  }, FALLBACK_DEALS as unknown);
}

export const isResolvedString = (value: unknown, key?: string): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  (key == null || value !== key) &&
  !PLACEHOLDER_TOKEN_REGEX.test(value);

const interpolateTemplate = (
  template: string,
  values?: Record<string, unknown>
): { result: string; missingToken: boolean } => {
  let missingToken = false;
  const result = template.replace(TEMPLATE_TOKEN_REGEX, (_, token: string) => {
    const value = values?.[token];
    if (value == null) {
      missingToken = true;
      return "";
    }

    return String(value);
  });

  return { result, missingToken };
};

export function resolveMetaString(key: string, value: string): string {
  if (isResolvedString(value, key)) {
    return value;
  }

  const fallback = getFallbackValue(key);
  if (isResolvedString(fallback, key)) {
    return fallback;
  }

  if (typeof fallback === "string" && fallback.trim().length > 0) {
    return fallback;
  }

  return key;
}

export function createFallbackTranslator(t: TFunction, fallbackT: TFunction): FallbackTranslator {
  return (key, options) => {
    let encounteredMissingTokens = false;

    const translate = (translator: TFunction, k: string, opts?: TOptions) =>
      (opts ? translator(k, opts) : translator(k)) as unknown;

    const asRecord = (opts?: TOptions) => opts as unknown as Record<string, unknown> | undefined;

    const tryResolve = (raw: unknown, opts?: TOptions): string | undefined => {
      if (isResolvedString(raw, key)) {
        return raw;
      }

      if (typeof raw === "string" && raw !== key) {
        if (!PLACEHOLDER_TOKEN_REGEX.test(raw)) {
          const trimmed = raw.trim();
          if (trimmed.length > 0) {
            return trimmed;
          }
        }

        const { result: interpolatedResult, missingToken } = interpolateTemplate(raw, asRecord(opts));
        if (missingToken) {
          encounteredMissingTokens = true;
          return undefined;
        }

        // Avoid type-guard narrowing on a value already typed as `string` (would yield `never` in else-branch).
        const trimmedInterpolated = interpolatedResult.trim();
        const isMeaningful =
          trimmedInterpolated.length > 0 &&
          (key == null || interpolatedResult !== key) &&
          !PLACEHOLDER_TOKEN_REGEX.test(interpolatedResult);
        if (isMeaningful) {
          // Preserve original spacing if it otherwise qualifies as meaningful.
          return interpolatedResult;
        }

        if (trimmedInterpolated.length > 0) {
          return trimmedInterpolated;
        }
      }

      return undefined;
    };

    const initialOptions = options as TOptions | undefined;
    const primaryRaw = translate(t, key, initialOptions);
    const primaryResolved = tryResolve(primaryRaw, initialOptions);
    if (primaryResolved) {
      return primaryResolved;
    }

    const englishRaw = translate(fallbackT, key, options);
    const englishTemplate =
      typeof englishRaw === "string" && englishRaw.trim().length > 0 && englishRaw !== key
        ? englishRaw
        : undefined;
    const englishString =
      englishTemplate && !PLACEHOLDER_TOKEN_REGEX.test(englishTemplate) ? englishTemplate.trim() : undefined;

    const fallbackRaw = getFallbackValue(key);
    const fallbackTemplate =
      typeof fallbackRaw === "string" && fallbackRaw.trim().length > 0 && fallbackRaw !== key
        ? fallbackRaw
        : undefined;

    const defaultText = englishTemplate ?? fallbackTemplate;
    const shouldInjectDefault =
      typeof defaultText === "string" && (options == null || typeof options.defaultValue !== "string");
    const optionsWithDefault = shouldInjectDefault
      ? ({ ...options, defaultValue: defaultText } as TOptions)
      : (options as TOptions | undefined);

    if (shouldInjectDefault) {
      const rawWithDefault = translate(t, key, optionsWithDefault);
      const resolvedWithDefault = tryResolve(rawWithDefault, optionsWithDefault);
      if (resolvedWithDefault) {
        return resolvedWithDefault;
      }
    }

    if (englishString) {
      return englishString;
    }

    const interpolationOptions = optionsWithDefault;
    const tryTemplate = (template?: string): string | undefined => {
      if (typeof template !== "string") {
        return undefined;
      }

      const { result: interpolatedResult, missingToken } = interpolateTemplate(
        template,
        asRecord(interpolationOptions),
      );
      if (missingToken) {
        encounteredMissingTokens = true;
        return undefined;
      }

      const trimmed = interpolatedResult.trim();
      if (trimmed.length > 0 && !PLACEHOLDER_TOKEN_REGEX.test(trimmed)) {
        return trimmed;
      }

      if (trimmed.length > 0) {
        return trimmed;
      }

      return undefined;
    };

    const templateCandidates = [
      typeof optionsWithDefault?.defaultValue === "string" ? optionsWithDefault.defaultValue : undefined,
      englishTemplate,
      fallbackTemplate,
    ];

    for (const candidate of templateCandidates) {
      const resolved = tryTemplate(candidate);
      if (resolved) {
        return resolved;
      }
    }

    if (encounteredMissingTokens) {
      return "";
    }

    if (typeof fallbackRaw === "string" && fallbackRaw.trim().length > 0) {
      return fallbackRaw.trim();
    }

    if (fallbackRaw != null) {
      return String(fallbackRaw);
    }

    return key;
  };
}

export type TokenResolver = (key: string) => string;

export function createTokenResolver(tokensT: TFunction, fallbackTokensT: TFunction): TokenResolver {
  return (key) => {
    const value = tokensT(key) as unknown;
    if (isResolvedString(value, key)) {
      return value;
    }

    const fallback = fallbackTokensT(key) as unknown;
    if (isResolvedString(fallback, key)) {
      return fallback;
    }

    return key;
  };
}
