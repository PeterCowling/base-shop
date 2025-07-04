import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/cn";

export interface Category {
  id: string;
  title: string;
  image: string;
  description?: string;
}

export interface CategoryCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  category: Category;
  /** Override default padding classes. */
  padding?: string;
}

export const CategoryCard = React.forwardRef<HTMLDivElement, CategoryCardProps>(
  ({ category, padding = "p-4", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-3 rounded-lg border",
        padding,
        className
      )}
      {...props}
    >
      <div className="relative aspect-square">
        <Image
          src={category.image}
          alt={category.title}
          fill
          sizes="(min-width: 640px) 25vw, 50vw"
          className="rounded-md object-cover"
        />
      </div>
      <h3 className="font-medium">{category.title}</h3>
      {category.description && (
        <p className="text-muted-foreground text-sm">{category.description}</p>
      )}
    </div>
  )
);
CategoryCard.displayName = "CategoryCard";
