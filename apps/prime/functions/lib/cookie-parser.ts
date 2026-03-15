/** Parse a specific cookie value from a Cookie header string by name. */
export function parseCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key.trim() === name) {
      return rest.join('=').trim() || null;
    }
  }
  return null;
}
