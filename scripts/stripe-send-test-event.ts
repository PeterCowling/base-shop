// scripts/stripe-send-test-event.ts

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * POST a Stripe event fixture to a local webhook.
 *
 * @param eventName Name of the fixture file without extension.
 * @param webhookUrl URL to POST the event to.
 */
export async function sendStripeTestEvent(
  eventName: string,
  webhookUrl: string,
) {
  const fixturePath = resolve(
    process.cwd(),
    "packages/stripe/test/fixtures",
    `${eventName}.json`,
  );
  const body = await readFile(fixturePath, "utf8");
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res;
}

async function main() {
  const [eventName, url] = process.argv.slice(2);
  if (!eventName) {
    console.error(
      "Usage: pnpm stripe:send-test-event <event> [url]",
    );
    process.exit(1);
  }
  const webhookUrl = url ?? "http://localhost:3000/api/stripe-webhook";
  try {
    const res = await sendStripeTestEvent(eventName, webhookUrl);
    console.log(
      `Sent ${eventName} to ${webhookUrl}: ${res.status} ${res.statusText}`,
    );
    const text = await res.text();
    if (text) console.log(text);
  } catch (err) {
    console.error(`Failed to send ${eventName} to ${webhookUrl}`, err);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("stripe-send-test-event.ts")) {
  // executed via tsx
  main();
}
