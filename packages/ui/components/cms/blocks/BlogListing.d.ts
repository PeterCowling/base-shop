/// <reference types="react" />
export type BlogPost = {
    title: string;
    excerpt?: string;
    url?: string;
};
export default function BlogListing({ posts }: {
    posts?: BlogPost[];
}): import("react").JSX.Element;
