// src/app/[lang]/assistance/layout.tsx
// Assistance section layout - App Router version
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function AssistanceLayout({ children }: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}
