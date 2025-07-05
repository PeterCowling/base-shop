import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../utils/cn";
import { CategoryCard } from "../organisms/CategoryCard";
export function CategoryCollectionTemplate({ categories, columns = 3, className, ...props }) {
    const style = {
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    };
    return (_jsx("div", { className: cn("grid gap-6", className), style: style, ...props, children: categories.map((c) => (_jsx(CategoryCard, { category: c }, c.id))) }));
}
