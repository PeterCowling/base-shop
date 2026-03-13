/**
 * maskEmail — mask customer email for list view.
 * Shows first character + *** + domain: "j***@gmail.com"
 * Returns null if input is null or empty.
 */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return "***";
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex); // includes the @
  const visiblePrefix = local.slice(0, 1);
  return `${visiblePrefix}***${domain}`;
}
