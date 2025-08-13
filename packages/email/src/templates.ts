export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

const templates: Record<string, EmailTemplate> = {
  welcome: {
    subject: "Welcome, {{name}}!",
    html: "<p>Hello {{name}}, welcome.</p>",
    text: "Hello {{name}}, welcome.",
  },
};

function interpolate(str: string, vars: Record<string, string>): string {
  return str.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    return vars[key] ?? "";
  });
}

export function renderTemplate(
  id: string,
  vars: Record<string, string>
): EmailTemplate {
  const template = templates[id];
  if (!template) {
    throw new Error(`Unknown template: ${id}`);
  }
  return {
    subject: interpolate(template.subject, vars),
    html: interpolate(template.html, vars),
    ...(template.text ? { text: interpolate(template.text, vars) } : {}),
  };
}

export { templates };
