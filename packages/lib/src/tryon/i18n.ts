import en from "@acme/i18n/en.json";

type Messages = typeof en;
type MessageKey = keyof Messages;
type TemplateVars = Record<string, string | number | boolean | undefined>;

const messages: Messages = en;

export function t(key: MessageKey, vars?: TemplateVars): string {
  const template = messages[key] ?? (key as string);
  if (!vars) return template;
  return template.replace(/\{(.*?)\}/g, (match, name) => {
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      const value = vars[name];
      return value === undefined ? match : String(value);
    }
    return match;
  });
}
