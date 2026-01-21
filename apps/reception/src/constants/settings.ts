export const settings = {
  blindOpen: process.env["NEXT_PUBLIC_BLIND_OPEN"] === "true",
  blindClose: process.env["NEXT_PUBLIC_BLIND_CLOSE"] === "true",

  cashDrawerLimit:
    parseFloat(process.env["NEXT_PUBLIC_CASH_DRAWER_LIMIT"] || "1000") || 1000,
  pinRequiredAboveLimit:
    process.env["NEXT_PUBLIC_PIN_REQUIRED_ABOVE_LIMIT"] === "true",
  /** Maximum allowed cash before safe drop required */
  tillMaxLimit:
    parseFloat(process.env["NEXT_PUBLIC_TILL_MAX_LIMIT"] || "2000") || 2000,
};
