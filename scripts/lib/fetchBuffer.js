import fetch from "node-fetch";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export async function fetchBuffer(url, redirectsLeft = 5) {
  const response = await fetch(url, { redirect: "manual" });

  if (REDIRECT_STATUSES.has(response.status)) {
    if (!redirectsLeft) {
      throw new Error("Too many redirects while fetching rates.json");
    }
    const location = response.headers.get("location");
    if (!location) {
      throw new Error("Redirect response missing location header");
    }
    const target = location.startsWith("http")
      ? location
      : `https://drive.google.com${location}`;
    return fetchBuffer(target, redirectsLeft - 1);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching rates.json`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}