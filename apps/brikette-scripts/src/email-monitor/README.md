# Brikette Email Monitor - Google Apps Script

Automatically monitors Gmail inbox and labels customer inquiry emails with `Brikette/Inbox/Needs-Processing` for the email autodraft workflow.

## Setup Instructions

### 1. Create Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Name it: "Brikette Email Monitor"
4. Delete the default code in `Code.gs`
5. Copy the contents of `Code.gs` from this folder and paste it

### 2. Create Gmail Labels (if not already done)

Run in the script editor:
```javascript
createAllLabels()
```

Or create manually in Gmail:
- `Brikette/Inbox/Needs-Processing`
- `Brikette/Inbox/Processing`
- `Brikette/Drafts/Ready-For-Review`
- `Brikette/Drafts/Sent`
- `Brikette/Promotional`

### 3. Test the Script

1. In the script editor, select `testScan` from the function dropdown
2. Click **Run**
3. Authorize the script when prompted (first time only)
4. Check the execution log for results

### 4. Enable Automatic Trigger

Run once to create the 30-minute trigger:
```javascript
setupTrigger()
```

Or in the script editor:
1. Select `setupTrigger` from the dropdown
2. Click **Run**

### 5. Verify Trigger

1. Go to **Triggers** (clock icon in left sidebar)
2. You should see: `scanInboxForCustomerEmails` - Time-driven - Every 30 minutes

## How It Works

1. **Every 30 minutes**, the script scans your inbox for emails from the last 48 hours
2. **Filters out** automated emails:
   - Booking confirmations from OTAs (Booking.com, Expedia, etc.)
   - Newsletter/marketing emails (detected by List-Unsubscribe header)
   - System notifications (mailer-daemon, postmaster)
   - Automated replies (out of office, delivery status)
3. **Labels customer emails** with `Brikette/Inbox/Needs-Processing`
4. **Skips emails** that already have any Brikette label

## Configuration

Edit the `CONFIG` object in `Code.gs` to customize:

```javascript
const CONFIG = {
  // How far back to look (hours)
  LOOKBACK_HOURS: 48,

  // Max emails per run (prevent timeout)
  MAX_EMAILS_PER_RUN: 50,

  // Add senders to exclude
  EXCLUDE_PATTERNS: {
    senders: [...],
    subjects: [...],
    domains: [...],
  },
};
```

## Maintenance

### View Logs

1. Go to **Executions** (play icon in left sidebar)
2. Click on any execution to see logs

### Disable Monitoring

Run:
```javascript
removeTrigger()
```

### Re-enable Monitoring

Run:
```javascript
setupTrigger()
```

## Troubleshooting

### "Authorization required"
- Click **Review Permissions** and grant access to Gmail

### Emails not being labeled
- Check logs for errors
- Verify the email isn't from an excluded sender/domain
- Check if the email already has a Brikette label

### Too many emails being labeled
- Add more patterns to `EXCLUDE_PATTERNS`
- Reduce `LOOKBACK_HOURS`

## Integration with MCP Tools

This script works with the MCP server Gmail tools:

1. **GAS Script** labels emails as `Needs-Processing`
2. **`gmail_list_pending`** fetches emails with that label
3. **`gmail_mark_processed`** removes the label when done

The MCP tools don't modify emails labeled by this script until explicitly processed.
