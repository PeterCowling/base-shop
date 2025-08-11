export function getCsrfToken(): string {
  let csrfToken =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("csrf_token="))
          ?.split("=")[1]
      : undefined;
  if (typeof document !== "undefined" && !csrfToken) {
    csrfToken = crypto.randomUUID();
    document.cookie = `csrf_token=${csrfToken}; path=/; SameSite=Strict${
      location.protocol === "https:" ? "; secure" : ""
    }`;
  }
  return csrfToken ?? "";
}
