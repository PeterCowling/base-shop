import * as React from "react";
import type { Product } from "../organisms/ProductCard";
export interface ChatMessage {
    id: string;
    user: string;
    message: string;
}
export interface LiveShoppingEventTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    streamUrl: string;
    products?: Product[];
    chatMessages?: ChatMessage[];
    onSendMessage?: (message: string) => void;
    onAddToCart?: (product: Product) => void;
    ctaLabel?: string;
}
export declare function LiveShoppingEventTemplate({ streamUrl, products, chatMessages, onSendMessage, onAddToCart, ctaLabel, className, ...props }: LiveShoppingEventTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=LiveShoppingEventTemplate.d.ts.map