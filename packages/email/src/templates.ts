const templates: Record<string, string> = {};

/**
 * Register or replace a template by ID.
 */
export function registerTemplate(id: string, template: string): void {
  templates[id] = template;
}

/**
 * Clear all registered templates. Primarily for testing.
 */
export function clearTemplates(): void {
  for (const key of Object.keys(templates)) {
    delete templates[key];
  }
}

/**
 * Render a template with the provided variables. Placeholders in the template
 * use the Handlebars-like syntax `{{variable}}`.
 */
export function renderTemplate(
  id: string,
  variables: Record<string, string>,
): string {
  const source = templates[id];
  if (!source) throw new Error(`Unknown template: ${id}`);
  return source.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    return variables[key] ?? "";
  });
}
