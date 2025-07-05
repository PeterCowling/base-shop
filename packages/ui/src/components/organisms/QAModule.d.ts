import * as React from "react";
export interface QAItem {
    question: string;
    answer: React.ReactNode;
}
export interface QAModuleProps extends React.HTMLAttributes<HTMLDivElement> {
    items: QAItem[];
}
/**
 * Collapsible list of questions and answers.
 */
export declare function QAModule({ items, className, ...props }: QAModuleProps): import("react/jsx-runtime").JSX.Element;
