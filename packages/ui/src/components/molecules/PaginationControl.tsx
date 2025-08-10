import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms";

export interface PaginationControlProps
  extends React.HTMLAttributes<HTMLDivElement> {
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
}

export function PaginationControl({
  page,
  pageCount,
  onPageChange,
  className,
  ...props
}: PaginationControlProps) {
  const maxButtons = 5;
  const start = Math.max(1, Math.min(page - 2, pageCount - maxButtons + 1));
  const end = Math.min(pageCount, start + maxButtons - 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const change = (p: number) => {
    if (p >= 1 && p <= pageCount) onPageChange?.(p);
  };

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <Button
        variant="outline"
        onClick={() => change(page - 1)}
        disabled={page === 1}
      >
        Prev
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          onClick={() => change(p)}
        >
          {p}
        </Button>
      ))}
      <Button
        variant="outline"
        onClick={() => change(page + 1)}
        disabled={page === pageCount}
      >
        Next
      </Button>
    </div>
  );
}

PaginationControl.displayName = "PaginationControl";
