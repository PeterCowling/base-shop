import type { ImageOrientation, MediaItem } from "@types";
/** Return list of uploaded file URLs for a shop */
export declare function listMedia(shop: string): Promise<MediaItem[]>;
/** Save uploaded file and return its public URL */
export declare function uploadMedia(shop: string, formData: FormData, requiredOrientation?: ImageOrientation): Promise<MediaItem>;
/** Delete an uploaded file */
export declare function deleteMedia(shop: string, filePath: string): Promise<void>;
//# sourceMappingURL=media.server.d.ts.map