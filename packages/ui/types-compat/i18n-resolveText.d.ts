declare module "@acme/i18n/resolveText" {
  export function resolveText(
    text: unknown,
    locale: string,
    t: (key: string, vars?: Record<string, unknown>) => string
  ): string;
  export default resolveText;
}
