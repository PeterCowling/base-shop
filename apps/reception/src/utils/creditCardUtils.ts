/* src/utils/creditCardUtils.ts */

export function formatCreditCardNumber(value = ""): string {
  const digits = value.replace(/\D/g, "");
  const matches = digits.match(/.{1,4}/g) || [];
  return matches.join(" ");
}

export function splitExpiry(value = ""): { mm: string; yy: string } {
  const digits = value.replace(/\D/g, "");
  const mm = digits.slice(0, 2);
  const yy = digits.slice(2, 4);
  return { mm, yy };
}
