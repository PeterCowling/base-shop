import type { Metadata } from "next";
export declare function generateStaticParams(): Promise<{
    lang: "en" | "de" | "it";
    slug: string;
}[]>;
export declare const revalidate = 60;
export declare function generateMetadata({ params, }: {
    params: {
        slug: string;
    };
}): Metadata;
export default function ProductDetailPage({ params, }: {
    params: {
        slug: string;
    };
}): import("react/jsx-runtime").JSX.Element;
