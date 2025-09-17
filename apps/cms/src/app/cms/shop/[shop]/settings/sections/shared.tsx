import type { ReactNode } from "react";
import type { MappingRow } from "@/hooks/useMappingRows";

export interface MappingListProps {
  rows: MappingRow[];
  onAdd: () => void;
  onUpdate: (index: number, field: "key" | "value", value: string) => void;
  onRemove: (index: number) => void;
  error?: string[];
}

export const renderError = (messages?: string[]): ReactNode | undefined =>
  messages?.length ? (
    <span role="alert">{messages.join("; ")}</span>
  ) : undefined;
