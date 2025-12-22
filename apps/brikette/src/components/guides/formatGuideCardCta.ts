// src/components/guides/formatGuideCardCta.ts
const CTA_PLACEHOLDER_PATTERN =
  /\{\{\s*(guideTitle|title|itemTitle|storyTitle)\s*\}\}|\{\s*(guideTitle|title|itemTitle|storyTitle)\s*\}/g;

export const formatGuideCardCta = (template: string, title: string): string => {
  if (!template.trim()) {
    return template;
  }

  const replacements: Record<string, string> = {
    guideTitle: title,
    title,
    itemTitle: title,
    storyTitle: title,
  };

  return template.replace(
    CTA_PLACEHOLDER_PATTERN,
    (_match, namedMatch?: string, fallbackMatch?: string) => {
      const key = namedMatch ?? fallbackMatch;
      return key ? replacements[key] ?? title : title;
    },
  );
};
