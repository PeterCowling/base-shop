/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 editor types are developer-facing */
import type { GuideContentInput } from "@/routes/guides/content-schema";

export type EditorTab = "overview" | "sections" | "faqs" | "gallery" | "raw";

export type TabProps = {
  content: GuideContentInput;
  updateField: (path: string, value: unknown) => void;
};

export type LoadState = "idle" | "loading" | "saving";

export const EDITOR_TABS: { id: EditorTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "sections", label: "Sections" },
  { id: "faqs", label: "FAQs" },
  { id: "gallery", label: "Gallery" },
  { id: "raw", label: "Raw JSON" },
];

/**
 * Deep set a value at a dot-notation path in an object.
 * Creates intermediate objects as needed.
 */
export function setDeep<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown,
): T {
  const keys = path.split(".");
  const result = { ...obj } as Record<string, unknown>;
  let current = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (typeof current[key] !== "object" || current[key] === null) {
      current[key] = {};
    } else {
      current[key] = { ...(current[key] as Record<string, unknown>) };
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;

  return result as T;
}
