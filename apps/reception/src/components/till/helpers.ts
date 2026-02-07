/** Helper utilities for till components */

/**
 * Format an item category string for display.
 * - Inserts spaces before capital letters
 * - Capitalizes each word
 * - Returns the string with newline characters between words so that
 *   they render on separate lines when used with `whitespace-pre-line`.
 */
export const formatItemCategory = (category?: string): string => {
  if (!category) return "-";

  const mapping: Record<string, string> = {
    KeycardDeposit: "Keycard Deposit",
    cityTax: "City Tax",
    KeycardDepositRefund: "Keycard Deposit Refund",
  };

  const text =
    mapping[category] || category.replace(/([a-z])([A-Z])/g, "$1 $2");

  return text
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("\n");
};

/**
 * Map verbose descriptions from the bar POS to shorter labels for display.
 * Returns `null` for descriptions that should be hidden entirely.
 */
export const summariseDescription = (description?: string): string | null => {
  if (!description) return "-";

  const normalised = description.replace(/\s+/g, " ").trim().toLowerCase();

  if (normalised.includes("eggs with three sides")) {
    // Skip the placeholder item used when selecting egg sides
    return null;
  }
  if (normalised.includes("sunny side up")) {
    return "SSU";
  }
  if (normalised.includes("multi-v")) {
    return "Multi-V";
  }
  if (normalised.includes("orange juice") && normalised.includes("carton")) {
    return "OJ Carton";
  }

  return description;
};
