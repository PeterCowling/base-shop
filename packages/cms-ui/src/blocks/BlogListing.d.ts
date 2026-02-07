export type BlogPost = {
    title: string;
    excerpt?: string;
    url?: string;
    shopUrl?: string;
};
export default function BlogListing({ posts }: {
    posts?: BlogPost[];
}): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=BlogListing.d.ts.map