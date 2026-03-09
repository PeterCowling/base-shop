import type { LucideIcon } from "lucide-react";
import { Ban, CreditCard, FileText } from "lucide-react";

import type { LoanMethod } from "../types/hooks/data/loansData";

/**
 * Returns the Lucide icon component and color class for a given keycard deposit type.
 */
export function getKeycardIcon(
  depositType?: LoanMethod | string
): { Icon: LucideIcon; colorClass: string } {
  const normalized = depositType ? depositType.toUpperCase() : undefined;

  if (normalized === "NO_CARD") return { Icon: Ban, colorClass: "text-error-main" };
  if (normalized === "CASH") return { Icon: CreditCard, colorClass: "text-success-main" };
  if (
    normalized === "PASSPORT" ||
    normalized === "LICENSE" ||
    normalized === "ID"
  ) {
    return { Icon: FileText, colorClass: "text-warning-main" };
  }
  console.warn("[getKeycardIcon] Unrecognized deposit type for Keycard:", depositType);
  return { Icon: CreditCard, colorClass: "text-foreground" };
}
