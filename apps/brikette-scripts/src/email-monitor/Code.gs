/**
 * Brikette Email Monitor - Google Apps Script
 *
 * Monitors Gmail inbox and applies "Brikette/Inbox/Needs-Processing" label
 * to customer inquiry emails. Runs on a time-based trigger (every 30 minutes).
 *
 * Setup:
 * 1. Create new Google Apps Script project at script.google.com
 * 2. Copy this code into Code.gs
 * 3. Run setupTrigger() once to create the timed trigger
 * 4. Authorize when prompted
 *
 * Labels required (create in Gmail first):
 * - Brikette/Inbox/Needs-Processing
 * - Brikette/Inbox/Processing (optional, used by MCP tools)
 */

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Label to apply to emails needing response
  NEEDS_PROCESSING_LABEL: "Brikette/Inbox/Needs-Processing",

  // How far back to look for unprocessed emails (hours)
  LOOKBACK_HOURS: 48,

  // Maximum emails to process per run (avoid timeout)
  MAX_EMAILS_PER_RUN: 50,

  // Email patterns to EXCLUDE (not customer inquiries)
  EXCLUDE_PATTERNS: {
    // Automated booking confirmations (we send these, not receive inquiries)
    senders: [
      "noreply@booking.com",
      "no-reply@booking.com",
      "noreply@hotels.com",
      "noreply@expedia.com",
      "noreply@agoda.com",
      "noreply@airbnb.com",
      "noreply@hostelworld.com",
      "mailer-daemon@",
      "postmaster@",
    ],

    // Subject patterns that indicate non-customer emails
    subjects: [
      /^(Re:|Fwd:)?\s*Booking confirmation/i,
      /^(Re:|Fwd:)?\s*Reservation confirmed/i,
      /^(Re:|Fwd:)?\s*Your booking/i,
      /^(Re:|Fwd:)?\s*Payment received/i,
      /^(Re:|Fwd:)?\s*Invoice/i,
      /^(Re:|Fwd:)?\s*Receipt/i,
      /newsletter/i,
      /unsubscribe/i,
      /^(Re:|Fwd:)?\s*Out of office/i,
      /^(Re:|Fwd:)?\s*Automatic reply/i,
      /delivery status notification/i,
      /^Returned mail/i,
    ],

    // Domains that are likely promotional/automated
    domains: [
      "booking.com",
      "expedia.com",
      "hotels.com",
      "agoda.com",
      "tripadvisor.com",
      "kayak.com",
      "trivago.com",
      "mailchimp.com",
      "sendgrid.net",
      "amazonses.com",
    ],
  },

  // Labels that indicate email is already processed
  PROCESSED_LABELS: [
    "Brikette/Inbox/Needs-Processing",
    "Brikette/Inbox/Processing",
    "Brikette/Drafts/Ready-For-Review",
    "Brikette/Drafts/Sent",
    "Brikette/Promotional",
  ],
};

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Main function - scans inbox and labels customer emails
 * Called by time-based trigger every 30 minutes
 */
function scanInboxForCustomerEmails() {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Starting inbox scan...`);

  try {
    // Get or create the label
    const label = getOrCreateLabel(CONFIG.NEEDS_PROCESSING_LABEL);
    if (!label) {
      console.error("Failed to get/create label");
      return;
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - CONFIG.LOOKBACK_HOURS);

    // Search for recent emails in inbox that haven't been processed
    const query = buildSearchQuery(cutoffDate);
    console.log(`Search query: ${query}`);

    const threads = GmailApp.search(query, 0, CONFIG.MAX_EMAILS_PER_RUN);
    console.log(`Found ${threads.length} threads to check`);

    let labeled = 0;
    let skipped = 0;

    for (const thread of threads) {
      const messages = thread.getMessages();
      const latestMessage = messages[messages.length - 1];

      // Check if this is a customer email
      if (isCustomerEmail(latestMessage)) {
        // Check if thread already has any Brikette label
        if (!hasProcessedLabel(thread)) {
          thread.addLabel(label);
          labeled++;
          console.log(`Labeled: "${thread.getFirstMessageSubject()}" from ${latestMessage.getFrom()}`);
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    console.log(`Scan complete in ${duration}s. Labeled: ${labeled}, Skipped: ${skipped}`);

  } catch (error) {
    console.error(`Error during scan: ${error.message}`);
    // Optionally send error notification
    // sendErrorNotification(error);
  }
}

/**
 * Build Gmail search query for unprocessed emails
 */
function buildSearchQuery(cutoffDate) {
  const dateStr = Utilities.formatDate(cutoffDate, "GMT", "yyyy/MM/dd");

  // Search inbox emails after cutoff date
  // Exclude emails already in Brikette labels
  let query = `in:inbox after:${dateStr}`;

  // Exclude already-labeled emails
  for (const label of CONFIG.PROCESSED_LABELS) {
    query += ` -label:${label.replace(/\//g, "-")}`;
  }

  return query;
}

/**
 * Check if an email appears to be from a customer (vs automated/promotional)
 */
function isCustomerEmail(message) {
  const from = message.getFrom().toLowerCase();
  const subject = message.getSubject() || "";

  // Check excluded senders
  for (const sender of CONFIG.EXCLUDE_PATTERNS.senders) {
    if (from.includes(sender.toLowerCase())) {
      return false;
    }
  }

  // Check excluded domains
  const emailMatch = from.match(/@([a-z0-9.-]+)/i);
  if (emailMatch) {
    const domain = emailMatch[1];
    for (const excludeDomain of CONFIG.EXCLUDE_PATTERNS.domains) {
      if (domain === excludeDomain || domain.endsWith(`.${excludeDomain}`)) {
        return false;
      }
    }
  }

  // Check excluded subject patterns
  for (const pattern of CONFIG.EXCLUDE_PATTERNS.subjects) {
    if (pattern.test(subject)) {
      return false;
    }
  }

  // Check if it looks like a mailing list
  const headers = message.getHeader("List-Unsubscribe");
  if (headers) {
    return false;
  }

  // Passed all checks - likely a customer email
  return true;
}

/**
 * Check if thread already has any Brikette processing label
 */
function hasProcessedLabel(thread) {
  const labels = thread.getLabels();
  for (const label of labels) {
    const name = label.getName();
    if (name.startsWith("Brikette/")) {
      return true;
    }
  }
  return false;
}

/**
 * Get existing label or create if it doesn't exist
 */
function getOrCreateLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);

  if (!label) {
    console.log(`Creating label: ${labelName}`);
    label = GmailApp.createLabel(labelName);
  }

  return label;
}

// ============================================================================
// Setup & Utility Functions
// ============================================================================

/**
 * One-time setup: Create the time-based trigger
 * Run this manually once after deploying the script
 */
function setupTrigger() {
  // Remove any existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === "scanInboxForCustomerEmails") {
      ScriptApp.deleteTrigger(trigger);
      console.log("Removed existing trigger");
    }
  }

  // Create new trigger - runs every 30 minutes
  ScriptApp.newTrigger("scanInboxForCustomerEmails")
    .timeBased()
    .everyMinutes(30)
    .create();

  console.log("Created trigger: scanInboxForCustomerEmails every 30 minutes");
}

/**
 * Remove the trigger (for disabling the monitor)
 */
function removeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === "scanInboxForCustomerEmails") {
      ScriptApp.deleteTrigger(trigger);
      console.log("Removed trigger");
    }
  }
}

/**
 * Manual test: Run scan once without trigger
 */
function testScan() {
  console.log("Running manual test scan...");
  scanInboxForCustomerEmails();
}

/**
 * Utility: List all Brikette labels
 */
function listBriketteLabels() {
  const labels = GmailApp.getUserLabels();
  console.log("Brikette labels:");
  for (const label of labels) {
    if (label.getName().startsWith("Brikette")) {
      console.log(`  - ${label.getName()}`);
    }
  }
}

/**
 * Utility: Create all required Brikette labels
 */
function createAllLabels() {
  const labels = [
    "Brikette",
    "Brikette/Inbox",
    "Brikette/Inbox/Needs-Processing",
    "Brikette/Inbox/Processing",
    "Brikette/Drafts",
    "Brikette/Drafts/Ready-For-Review",
    "Brikette/Drafts/Sent",
    "Brikette/Promotional",
  ];

  for (const labelName of labels) {
    const existing = GmailApp.getUserLabelByName(labelName);
    if (!existing) {
      GmailApp.createLabel(labelName);
      console.log(`Created: ${labelName}`);
    } else {
      console.log(`Exists: ${labelName}`);
    }
  }
}
