import "server-only";
/**
 * Register or replace a template by ID.
 */
export declare function registerTemplate(id: string, template: string): void;
/**
 * Clear all registered templates. Primarily for testing.
 */
export declare function clearTemplates(): void;
/**
 * Render a template with the provided variables. Placeholders in the template
 * use the Handlebars-like syntax `{{variable}}`.
 */
export declare function renderTemplate(id: string, params: Record<string, string>): string;
//# sourceMappingURL=templates.d.ts.map