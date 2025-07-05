export type GalleryImage = {
    src: string;
    alt?: string;
};
export default function Gallery({ images }: {
    images?: GalleryImage[];
}): import("react/jsx-runtime").JSX.Element;
