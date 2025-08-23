import * as React from "react";
import type { SKU } from "@acme/types";
export interface ChatMessage {
    id: string;
    user: string;
    message: string;
}
export interface LiveShoppingEventTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    streamUrl: string;
    products?: SKU[];
    chatMessages?: ChatMessage[];
    onSendMessage?: (message: string) => void;
    onAddToCart?: (product: SKU) => void;
    ctaLabel?: string;
}
export declare function LiveShoppingEventTemplate({ streamUrl, products, chatMessages, onSendMessage, onAddToCart, ctaLabel, className, ...props }: LiveShoppingEventTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=LiveShoppingEventTemplate.d.ts.map