export declare function getShopFromPath(pathname: string): string | null;
export declare function replaceShopInPath(pathname: string, nextShop: string): string;
export { initTheme } from "./utils/initTheme";
export declare const logger: {
    info: (...a: any[]) => void;
    warn: (...a: any[]) => void;
    error: (...a: any[]) => void;
    debug: (...a: any[]) => void;
};
