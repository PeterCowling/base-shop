export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

const templates: Record<string, EmailTemplate> = {};

export function registerTemplate(id: string, template: EmailTemplate): void {
  templates[id] = template;
}

export function clearTemplates(): void {
  for (const key of Object.keys(templates)) delete templates[key];
}

export function renderTemplate(
  id: string,
  vars: Record<string, string>
): EmailTemplate {
  const tpl = templates[id];
  if (!tpl) {
    throw new Error(`Unknown template: ${id}`);
  }
  const render = (str: string): string =>
    str.replace(/{{\s*(\w+)\s*}}/g, (_m, key) => vars[key] ?? "");
  return {
    subject: render(tpl.subject),
    html: render(tpl.html),
    text: tpl.text ? render(tpl.text) : undefined,
  };
}
