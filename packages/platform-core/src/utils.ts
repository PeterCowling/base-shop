export function getShopFromPath(pathname: string): string | null {
  const m = pathname.match(/\/(?:cms\/)?shops?\/([^/]+)/);
  return m ? m[1] : null;
}
export function replaceShopInPath(pathname: string, nextShop: string): string {
  if (pathname.includes("/shops/")) {
    return pathname.replace(/\/shops\/[^/]+/, `/shops/${nextShop}`);
  }
  if (pathname.includes("/cms/shop/")) {
    return pathname.replace(/\/cms\/shop\/[^/]+/, `/cms/shop/${nextShop}`);
  }
  return pathname;
}

// Re-export the client theme initialiser used by various apps.  In the
// real project this lives in `src/utils/initTheme.ts`, but this file acts as
// the public entry point for `@platform-core/utils`, so we surface it here as
// well.
export { initTheme } from "./utils/initTheme";


export const logger = {
  info: (...a: any[]) => console.log(...a),
  warn: (...a: any[]) => console.warn(...a),
  error: (...a: any[]) => console.error(...a),
  debug: (...a: any[]) => console.debug(...a),
};
