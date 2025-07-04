import * as React from "react";
export interface Category {
    id: string;
    title: string;
    image: string;
    description?: string;
}
export interface CategoryCardProps extends React.HTMLAttributes<HTMLDivElement> {
    category: Category;
    /** Override default padding classes. */
    padding?: string;
}
export declare const CategoryCard: React.ForwardRefExoticComponent<CategoryCardProps & React.RefAttributes<HTMLDivElement>>;
