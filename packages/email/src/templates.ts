const registry: Record<string, string> = {};

/** Register a template by id */
export function registerTemplate(id: string, template: string): void {
  registry[id] = template;
}

/** Render a registered template with variables */
export function renderTemplate(
  id: string,
  variables: Record<string, string>
): string {
  const template = registry[id];
  if (!template) {
    throw new Error(`Template not found: ${id}`);
  }
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    return variables[key] ?? "";
  });
}
