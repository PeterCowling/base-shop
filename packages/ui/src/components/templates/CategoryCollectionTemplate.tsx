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
  const rootGridClass = "grid gap-6"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: layout class names
  const colsClass =
    {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    }[columns as 1 | 2 | 3 | 4 | 5 | 6] ?? undefined;

  return (
    <div className={cn(rootGridClass, colsClass, className)} {...props}>
      {categories.map((c) => (
        <CategoryCard key={c.id} category={c} />
      ))}
    </div>
  );
}
