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

function translateWithOptions(
  translator: TFunction,
  key: string,
  options?: TOptions,
): unknown {
  return (options ? translator(key, options) : translator(key)) as unknown;
}

function optionsAsRecord(options?: TOptions): Record<string, unknown> | undefined {
  return options as unknown as Record<string, unknown> | undefined;
}

function resolveRawTranslation(
  raw: unknown,
  key: string,
  options: TOptions | undefined,
  onMissingToken: () => void,
): string | undefined {
  if (isResolvedString(raw, key)) {
    return raw;
  }

  if (typeof raw !== "string" || raw === key) {
    return undefined;
  }

  if (!PLACEHOLDER_TOKEN_REGEX.test(raw)) {
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  const { result: interpolatedResult, missingToken } = interpolateTemplate(raw, optionsAsRecord(options));
  if (missingToken) {
    onMissingToken();
    return undefined;
  }

  const trimmedInterpolated = interpolatedResult.trim();
  const isMeaningful =
    trimmedInterpolated.length > 0 &&
    interpolatedResult !== key &&
    !PLACEHOLDER_TOKEN_REGEX.test(interpolatedResult);
  if (isMeaningful) {
    // Preserve original spacing if it otherwise qualifies as meaningful.
    return interpolatedResult;
  }

  return trimmedInterpolated.length > 0 ? trimmedInterpolated : undefined;
}

function resolveTemplateTranslation(
  template: string | undefined,
  interpolationOptions: TOptions | undefined,
  onMissingToken: () => void,
): string | undefined {
  if (typeof template !== "string") return undefined;

  const { result: interpolatedResult, missingToken } = interpolateTemplate(
    template,
    optionsAsRecord(interpolationOptions),
  );
  if (missingToken) {
    onMissingToken();
    return undefined;
  }

  const trimmed = interpolatedResult.trim();
  if (trimmed.length === 0) return undefined;
  return !PLACEHOLDER_TOKEN_REGEX.test(trimmed) ? trimmed : trimmed;
}

type FallbackPlan = {
  fallbackRaw: unknown;
  englishString: string | undefined;
  englishTemplate: string | undefined;
  fallbackTemplate: string | undefined;
  optionsWithDefault: TOptions | undefined;
  shouldInjectDefault: boolean;
};

function buildFallbackPlan(
  key: string,
  options: TOptions | undefined,
  fallbackT: TFunction,
): FallbackPlan {
  const englishRaw = translateWithOptions(fallbackT, key, options);
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
    : options;

  return {
    fallbackRaw,
    englishString,
    englishTemplate,
    fallbackTemplate,
    optionsWithDefault,
    shouldInjectDefault,
  };
}

function resolvePrimaryWithOptionalDefault(params: {
  translator: TFunction;
  key: string;
  shouldInjectDefault: boolean;
  optionsWithDefault: TOptions | undefined;
  onMissingToken: () => void;
}): string | undefined {
  const { translator, key, shouldInjectDefault, optionsWithDefault, onMissingToken } = params;
  if (!shouldInjectDefault) return undefined;
  const rawWithDefault = translateWithOptions(translator, key, optionsWithDefault);
  return resolveRawTranslation(rawWithDefault, key, optionsWithDefault, onMissingToken);
}

function resolveTemplateCandidates(params: {
  optionsWithDefault: TOptions | undefined;
  englishTemplate: string | undefined;
  fallbackTemplate: string | undefined;
  onMissingToken: () => void;
}): string | undefined {
  const { optionsWithDefault, englishTemplate, fallbackTemplate, onMissingToken } = params;
  const templateCandidates = [
    typeof optionsWithDefault?.defaultValue === "string" ? optionsWithDefault.defaultValue : undefined,
    englishTemplate,
    fallbackTemplate,
  ];
  for (const candidate of templateCandidates) {
    const resolved = resolveTemplateTranslation(candidate, optionsWithDefault, onMissingToken);
    if (resolved) return resolved;
  }
  return undefined;
}

function resolveFinalFallbackValue(
  key: string,
  fallbackRaw: unknown,
  encounteredMissingTokens: boolean,
): string {
  if (encounteredMissingTokens) return "";
  if (typeof fallbackRaw === "string" && fallbackRaw.trim().length > 0) return fallbackRaw.trim();
  if (fallbackRaw != null) return String(fallbackRaw);
  return key;
}

export function createFallbackTranslator(t: TFunction, fallbackT: TFunction): FallbackTranslator {
  return (key, options) => {
    let encounteredMissingTokens = false;
    const markMissingToken = () => {
      encounteredMissingTokens = true;
    };

    const initialOptions = options as TOptions | undefined;
    const primaryRaw = translateWithOptions(t, key, initialOptions);
    const primaryResolved = resolveRawTranslation(primaryRaw, key, initialOptions, markMissingToken);
    if (primaryResolved) {
      return primaryResolved;
    }

    const fallbackPlan = buildFallbackPlan(key, options as TOptions | undefined, fallbackT);

    const resolvedWithDefault = resolvePrimaryWithOptionalDefault({
      translator: t,
      key,
      shouldInjectDefault: fallbackPlan.shouldInjectDefault,
      optionsWithDefault: fallbackPlan.optionsWithDefault,
      onMissingToken: markMissingToken,
    });
    if (resolvedWithDefault) return resolvedWithDefault;

    if (fallbackPlan.englishString) return fallbackPlan.englishString;

    const templateResolved = resolveTemplateCandidates({
      optionsWithDefault: fallbackPlan.optionsWithDefault,
      englishTemplate: fallbackPlan.englishTemplate,
      fallbackTemplate: fallbackPlan.fallbackTemplate,
      onMissingToken: markMissingToken,
    });
    if (templateResolved) return templateResolved;

    return resolveFinalFallbackValue(key, fallbackPlan.fallbackRaw, encounteredMissingTokens);
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
