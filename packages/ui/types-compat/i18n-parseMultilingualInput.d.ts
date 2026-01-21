declare module "@acme/i18n/parseMultilingualInput" {
  export type ParseResult = { field: string; locale: string } | null;
  export function parseMultilingualInput(
    name: string,
    locales: readonly string[]
  ): ParseResult;
  export default parseMultilingualInput;
}
