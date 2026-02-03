/**
 * _RunBookingMonitor.gs
 *
 * Entry point for the Booking Monitor Google Apps Script.
 * Called by a time-based trigger in Google Apps Script to scan for new booking emails.
 *
 * Deployment ID: AKfycbz236VUyVFKEKkJF8QaiL_h9y75XuwWsl82-xfWepZwv1-gBroOr5S4t_og4Fvl4caW
 *
 * TRIGGER SETUP:
 * This script is called by a time-based trigger configured in Google Apps Script:
 * 1. Open the script at script.google.com
 * 2. Go to Triggers (clock icon in sidebar)
 * 3. Add trigger: triggerNewBookingsScan, Time-driven, Minutes timer (e.g. every 5 minutes)
 *
 * CONFIGURATION:
 * - SKIP_EMAIL_TEST: When true, skip sending test emails (production mode)
 * - SKIP_DBASE_TEST: When true, skip database test operations (production mode)
 * - daysBack: How many days back to search for emails
 * - maxEmails: Maximum number of emails to process per run
 */

/**
 * Runtime configuration object.
 * Toggle test flags for production vs development behavior.
 */
const RUN_CONFIG = {
  SKIP_EMAIL_TEST: true,   // Set to false to send test emails
  SKIP_DBASE_TEST: true,   // Set to false to run database tests
  daysBack: 7,             // Days back to search for booking emails
  maxEmails: 50            // Maximum emails to process per trigger run
};

/**
 * Main trigger function - called by time-based trigger.
 * Scans Gmail for new booking emails and processes them.
 *
 * @returns {void}
 */
function triggerNewBookingsScan() {
  scanNewEmailsForBookings(RUN_CONFIG);
}
