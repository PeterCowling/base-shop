export function getShopFromPath(pathname: string): string | null {
  const m = pathname.match(/\/shops\/([^/]+)/);
  return m ? m[1] : null;
}
export function replaceShopInPath(pathname: string, nextShop: string): string {
  return pathname.includes("/shops/") ? pathname.replace(/\/shops\/[^/]+/, `/shops/${nextShop}`) : pathname;
}


export const logger = {
  info: (...a: any[]) => console.log(...a),
  warn: (...a: any[]) => console.warn(...a),
  error: (...a: any[]) => console.error(...a),
  debug: (...a: any[]) => console.debug(...a),
};
