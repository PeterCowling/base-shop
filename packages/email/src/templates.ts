export interface EmailTemplate {
  subject: string;
  html: string;
}

const templates: Record<string, EmailTemplate> = {};

export function registerTemplate(id: string, template: EmailTemplate): void {
  templates[id] = template;
}

function replaceVars(str: string, vars: Record<string, string>): string {
  return str.replace(/{{\s*(\w+)\s*}}/g, (_m, key) => vars[key] ?? "");
}

export function renderTemplate(
  id: string,
  vars: Record<string, string>,
): EmailTemplate {
  const tpl = templates[id];
  if (!tpl) throw new Error(`Unknown template: ${id}`);
  return {
    subject: replaceVars(tpl.subject, vars),
    html: replaceVars(tpl.html, vars),
  };
}
