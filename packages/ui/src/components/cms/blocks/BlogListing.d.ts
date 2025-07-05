export type BlogPost = {
    title: string;
    excerpt?: string;
    url?: string;
};
export default function BlogListing({ posts }: {
    posts?: BlogPost[];
}): import("react/jsx-runtime").JSX.Element;
