import type { MediaItem } from "@acme/types";
export default function useMediaLibrary(): {
    media: MediaItem[];
    setMedia: import("react").Dispatch<import("react").SetStateAction<MediaItem[]>>;
    loadMedia: (query?: string) => Promise<void>;
    shop: string | undefined;
    loading: boolean;
    error: string | undefined;
};
//# sourceMappingURL=useMediaLibrary.d.ts.map