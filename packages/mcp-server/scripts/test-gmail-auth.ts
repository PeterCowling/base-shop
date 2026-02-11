import {
  getGmailClientStatus,
  runInteractiveSetup,
  testGmailConnection,
} from "../src/clients/gmail.js";

async function main(): Promise<void> {
  const status = getGmailClientStatus();
  console.info("[Gmail] Client status:");
  console.info(JSON.stringify(status, null, 2));

  const initial = await testGmailConnection();
  if (initial.success) {
    console.info(`[Gmail] Connected as ${initial.email}`);
    return;
  }

  console.info(`[Gmail] Initial connection failed: ${initial.error}`);
  console.info("[Gmail] Starting interactive OAuth setup...");

  const setup = await runInteractiveSetup();
  if (!setup.success) {
    throw new Error(`Interactive setup failed: ${setup.error}`);
  }

  const verification = await testGmailConnection();
  if (!verification.success) {
    throw new Error(`Post-setup verification failed: ${verification.error}`);
  }

  console.info(`[Gmail] Connected as ${verification.email}`);
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Gmail] Auth check failed: ${message}`);
  process.exit(1);
});
