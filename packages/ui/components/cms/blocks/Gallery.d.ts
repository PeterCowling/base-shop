/// <reference types="react" />
export type GalleryImage = {
    src: string;
    alt?: string;
};
export default function Gallery({ images }: {
    images?: GalleryImage[];
}): import("react").JSX.Element;
