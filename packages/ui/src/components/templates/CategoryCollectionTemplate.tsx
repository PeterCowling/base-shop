import * as React from "react";
import { cn } from "../../utils/style";
import { CategoryCard, type Category } from "../organisms/CategoryCard";

export interface CategoryCollectionTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  categories: Category[];
  columns?: number;
}

export function CategoryCollectionTemplate({
  categories,
  columns = 3,
  className,
  ...props
}: CategoryCollectionTemplateProps) {
  const style = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  } as React.CSSProperties;

  return (
    <div className={cn("grid gap-6", className)} style={style} {...props}>
      {categories.map((c) => (
        <CategoryCard key={c.id} category={c} />
      ))}
    </div>
  );
}
