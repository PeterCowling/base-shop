export type SKU = {
    id: string;
    slug: string;
    title: string;
    price: number;
    image: string;
    sizes: string[];
    description: string;
};
/** Mock catalogue (3 items) */
export declare const PRODUCTS: SKU[];
/** Helper to fetch one product (could be remote PIM later) */
export declare function getProductBySlug(slug: string): SKU | undefined;
