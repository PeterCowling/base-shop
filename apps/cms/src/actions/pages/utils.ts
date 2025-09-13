import { LOCALES } from "@acme/i18n";
import {
  historyStateSchema,
  type HistoryState,
  type Locale,
} from "@acme/types";
import { tryJsonParse } from "../../utils/formData";
import { captureException } from "@/utils/sentry.server";

export function mapLocales(
  data: Record<string, any>
): {
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  image: Record<Locale, string>;
} {
  const title: Record<Locale, string> = {} as Record<Locale, string>;
  const description: Record<Locale, string> = {} as Record<Locale, string>;
  const image: Record<Locale, string> = {} as Record<Locale, string>;
  LOCALES.forEach((l) => {
    title[l] = data[`title_${l}`];
    description[l] = data[`desc_${l}`];
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
