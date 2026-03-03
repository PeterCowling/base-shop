interface StockBadgeProps {
  stock: number;
  lowStockThreshold?: number;
}

export function StockBadge({ stock, lowStockThreshold = 2 }: StockBadgeProps) {
  if (stock === 0) {
    return (
      <span className="text-xs font-medium text-destructive">Out of stock</span>
    );
  }
  if (stock <= lowStockThreshold) {
    return (
      <span className="text-xs font-medium text-warning-foreground">
        Low stock ({stock} left)
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-success-foreground">
      In stock
    </span>
  );
}
