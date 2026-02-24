import messages from "../i18n/en.json";

type TranslationVars = Record<string, string | number>;

const dictionary = messages as Record<string, string>;

function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;

  return template.replace(/\{(.*?)\}/g, (match, name) => {
    return Object.prototype.hasOwnProperty.call(vars, name)
      ? String(vars[name])
      : match;
  });
}

export const xaI18n = {
  t(key: string, vars?: TranslationVars): string {
    const template = dictionary[key] ?? key;
    return interpolate(template, vars);
  },
} as const;
