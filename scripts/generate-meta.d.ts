export interface ProductData {
    id: string;
    title: string;
    description: string;
}
export interface GeneratedMeta {
    title: string;
    description: string;
    alt: string;
    image: string;
}
/**
 * Generate metadata for a product using an LLM and image model.
 * Requires OPENAI_API_KEY to be set. Generated images are written to
 * `public/og/<id>.png` and the returned `image` field is the public path.
 */
export declare function generateMeta(product: ProductData): Promise<GeneratedMeta>;
