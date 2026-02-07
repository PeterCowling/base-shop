import * as React from "react";

import { cn } from "../../utils/style";

export interface QAItem {
  question: string;
  answer: React.ReactNode;
}

export interface QAModuleProps extends React.HTMLAttributes<HTMLDivElement> {
  items: QAItem[];
}

/**
 * Collapsible list of questions and answers.
 */
export function QAModule({ items, className, ...props }: QAModuleProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {items.map((qa) => (
        <details key={qa.question} className="group rounded-md border p-4">
          <summary className="cursor-pointer font-medium group-open:mb-2">
            {qa.question}
          </summary>
          <div className="text-sm text-muted">{qa.answer}</div>
        </details>
      ))}
    </div>
  );
}
