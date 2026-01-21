import { LOCALES } from "@acme/i18n";
import {
  type HistoryState,
  historyStateSchema,
} from "@acme/page-builder-core";
import type { Locale } from "@acme/types";

import { captureException } from "@/utils/sentry.server";

import { tryJsonParse } from "../../utils/formData";

export function mapLocales(
  data: Record<string, string | undefined>
): {
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  image: Record<Locale, string>;
} {
  const title: Record<Locale, string> = {} as Record<Locale, string>;
  const description: Record<Locale, string> = {} as Record<Locale, string>;
  const image: Record<Locale, string> = {} as Record<Locale, string>;
  (LOCALES as readonly Locale[]).forEach((l) => {
    title[l] = data[`title_${l}`] ?? "";
    description[l] = data[`desc_${l}`] ?? "";
    image[l] = data.image ?? "";
  });
  return { title, description, image };
}

export async function parseHistory(
  raw: FormDataEntryValue | null
): Promise<HistoryState> {
  const historyInput = tryJsonParse<HistoryState>(raw);
  return historyStateSchema.parse(historyInput);
}

export async function reportError(
  err: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    if (context) {
      await captureException(err, { extra: context });
    } else {
      await captureException(err);
    }
  } catch {
    /* ignore sentry failure */
  }
}

export function computeRevisionId(input: unknown): string {
  try {
    const json = JSON.stringify(input ?? {});
    let hash = 0;
    for (let i = 0; i < json.length; i += 1) {
      hash = (hash << 5) - hash + json.charCodeAt(i);
      hash |= 0;
    }
    return `rev-${(hash >>> 0).toString(16)}`;
  } catch {
    return "rev-unknown";
  }
}
