export declare function shopPath(shop: string, ...segments: string[]): string;
export declare function readFromShop(shop: string, file: string, encoding?: BufferEncoding | null): Promise<string | Buffer>;
export declare function writeToShop(shop: string, file: string, data: string | Uint8Array, encoding?: BufferEncoding | null): Promise<void>;
export declare function appendToShop(shop: string, file: string, data: string | Uint8Array, encoding?: BufferEncoding | null): Promise<void>;
export declare function renameInShop(shop: string, from: string, to: string): Promise<void>;
export declare function ensureShopDir(shop: string): Promise<void>;
export declare function listShopsInDataRoot(): Promise<string[]>;
