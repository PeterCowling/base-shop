import type { MediaItem } from "@acme/types";
import type { ReactElement } from "react";

interface MediaItemWithUrl extends MediaItem {
  url: string;
}

export interface MediaDetailsFormValues {
  title: string;
  altText: string;
  tags: string[];
}

export interface MediaDetailsPanelProps {
    open: boolean;
    item: MediaItemWithUrl;
    loading: boolean;
    onSubmit: (fields: MediaDetailsFormValues) => void | Promise<void>;
    onClose: () => void;
}

export default function MediaDetailsPanel(props: MediaDetailsPanelProps): ReactElement;
export { MediaDetailsPanel };
