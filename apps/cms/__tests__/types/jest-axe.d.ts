declare module "jest-axe" {
  export function axe(html: Element | Document | string): Promise<any>;
  export function toHaveNoViolations(results: any): { pass: boolean; message: () => string };
}
