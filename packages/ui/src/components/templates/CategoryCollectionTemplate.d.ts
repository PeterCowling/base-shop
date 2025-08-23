import * as React from "react";
import { type Category } from "../organisms/CategoryCard";
export interface CategoryCollectionTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    categories: Category[];
    columns?: number;
}
export declare function CategoryCollectionTemplate({ categories, columns, className, ...props }: CategoryCollectionTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=CategoryCollectionTemplate.d.ts.map