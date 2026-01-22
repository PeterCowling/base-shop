import { type LoanItem } from "../../types/hooks/data/loansData";

export function getDepositForItem(item: LoanItem): number {
  switch (item) {
    case "Padlock":
    case "Keycard":
    case "Umbrella":
      return 10;
    case "Hairdryer":
    case "Steamer":
      return 20;
    default:
      return 0;
  }
}
