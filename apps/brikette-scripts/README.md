# Brikette Google Apps Scripts

Local copies of Google Apps Scripts deployed at script.google.com for Brikette email automation and guest communications.

## Purpose

These scripts handle:
- Booking email responses and monitoring
- Pre-arrival guest communications
- Guest email automation
- Statistics and monitoring

**Note:** These are the source files for reference and version control. The actual scripts are deployed and run on Google Apps Script platform.

## Script Projects

### 1. Booking Monitor (`src/booking-monitor/`)

Scans Gmail for new booking emails, extracts reservation data, and generates welcome emails.

**Deployment ID:** `AKfycbz236VUyVFKEKkJF8QaiL_h9y75XuwWsl82-xfWepZwv1-gBroOr5S4t_og4Fvl4caW`

**Files:**
- `_RunBookingMonitor.gs` - Entry point with config and trigger function
- `_BookingUtilities.gs` - Email parsing and data transformation utilities
- `_BookingImporterEmail.gs` - HTML and plain text email generation (`EmailsText` object)
- `_EmailsHelper.gs` - Helper functions for email formatting and room details
- `_EmailsConfig.gs` - Color schemes, styling, branding assets, header/footer/signature templates

**Trigger:** Time-based (e.g., every 5 minutes)

#### File Dependencies

```
_RunBookingMonitor.gs
    └── calls scanNewEmailsForBookings()
            └── uses BookingUtilities.extractEmailReservationData()
            └── uses EmailsText.Activity_1_generate()
                    ├── EmailsConfig.ColorSchemes[ActivityColors[1]] → color palette
                    ├── EmailsConfig.getStyles(colors) → CSS-in-JS style objects
                    ├── EmailsConfig.generateHeader(styles) → branded header HTML
                    ├── EmailsConfig.generateSignature(styles) → dual-owner signature block
                    ├── EmailsConfig.generateFooter(styles) → terms + social links
                    └── EmailsHelper (formatDateForEmail, getRoomDescription, etc.)
```

#### EmailsConfig Structure

The `_EmailsConfig.gs` file centralizes all branding and styling:

**URLs:**
- `hostelUrl` - Main website link
- `instagramUrl`, `tiktokUrl` - Social media profiles
- `termsUrl` - Terms and conditions (Google Doc)

**Image Assets (PNG + AVIF):**
- `hostelIconImg` / `hostelIconImgAvif` - Logo icon
- `criSignImg` / `criSignImgAvif` - Cristiana's signature image
- `peteSignImg` / `peteSignImgAvif` - Peter's signature image
- `instagramImg` / `instagramImgAvif`, `tiktokImg` / `tiktokImgAvif` - Social icons

**AVIF Fallback Pattern:**
```javascript
EmailsConfig.getAvifFallbackImage(avifUrl, pngUrl, altText, styleStr)
// Returns <picture> element with AVIF source + PNG fallback
```

**Color Schemes:**
```javascript
ColorSchemes: {
  yellow: {
    bgColourHeader: "#ffc107",    // Amber header
    bgColourMain: "#fff3cd",      // Light yellow body
    bgColourSignature: "#ffeeba", // Signature section
    bgColourFooter: "#fff3cd",    // Footer background
    textColourMain: "#856404"     // Dark amber text
  }
}
ActivityColors: { 1: "yellow" }   // Map activity types to schemes
```

**Template Generators:**
- `generateHeader(styles)` - Branded header with logo
- `generateSignature(styles)` - Dual-owner signature block (Cristiana + Peter)
- `generateFooter(styles)` - Terms link + social media icons

#### Booking Source Detection

The system identifies booking sources by reservation code format:
- **10 digits** → Booking.com (e.g., `1234567890`)
- **6 digits** → Hostel Brikette Website (e.g., `123456`)
- **Other formats** → Hostelworld (e.g., `7763-123456`)

#### Hostelworld Commission Handling

Reservation codes starting with `7763-` are Hostelworld bookings. The system automatically deducts the 15% Hostelworld commission:
```javascript
// Example: totalPrice = 274.19 (includes 10% tax)
const base = totalPrice / 1.1;        // 249.26 (pre-tax)
const commission = base * 0.15;       // 37.39 (15% commission)
const adjusted = totalPrice - commission; // 236.80 (net to hostel)
```

#### Room Number Mappings

| Room | Type | Beds | View |
|------|------|------|------|
| 3-4 | Value dorm | 4 bunks (8 beds) | No view |
| 5 | Superior dorm | 3 bunks (6 beds) | Sea view, terrace |
| 6 | Superior dorm | 3 bunks + 1 single (7 beds) | Sea view, terrace |
| 7 | Double room (private) | 1 double | Sea view, terrace |
| 8 | Garden view dorm | 1 bunk (2 beds) | Garden view |
| 9 | Premium dorm | 3 beds | No view |
| 10 | Premium dorm | 3 bunks (6 beds) | No view |
| 11-12 | Superior dorm | 3 bunks (6 beds) | Oversized sea view terrace |

#### Email Generation Workflow

1. **Trigger** → `triggerNewBookingsScan()` runs on schedule
2. **Parse** → `BookingUtilities.extractEmailReservationData()` extracts:
   - Reservation code, guest name, email
   - Check-in date, nights, total price
   - Room information, refundable status
3. **Transform** → Data is enriched with:
   - Booking source (via `determineBookingSource()`)
   - Payment terms (via `determinePaymentTermsContent()`)
   - Room details (via `getRoomDescription()`, `getBedDescription()`, `getRoomView()`)
   - Occupant links (digital assistant URLs)
4. **Generate** → `EmailsText.Activity_1_generate()` produces HTML email with:
   - Personalized greeting
   - Action Required block (non-refundable, non-Booking.com only)
   - Digital Assistant links section
   - Booking details table
   - Room details tables
   - Header, signature, and footer (from EmailsConfig)
5. **Send** → Email is sent via Gmail API

#### Action Required Block Logic

The "Action Required" block (requesting guest agreement within 48 hours) appears only when:
- Booking is **non-refundable** AND
- Booking is **NOT from Booking.com** (i.e., not 10-digit code)

Booking.com handles its own payment/agreement flow, so these guests don't need to reply "Agree".

### 2. Guest Email (planned: `src/guest-email/`)

Handles guest email communications.

**Deployment ID:** `AKfycbzEPvmqFeK1wW8VAid-cs6dhlQ49QDDOQR48whSU_jRQkbTQiNN38yjZSUVu9gYvlIx`

### 3. Alloggiati (planned: `src/alloggiati/`)

Italian guest registration system integration.

**Deployment ID:** `AKfycbxemYj6vv2k8qDyF3QieAfCujnlUeHMMKriYV8lkhLiHVvb7FnjTpwRTtF-Uo9-VT9UVQ`

### 4. Statistics (planned: `src/statistics/`)

Analytics and monitoring scripts.

**Deployment ID:** `AKfycbwzKYZ0FxoAgSlt98OruRKSaW8OAe4Ug3e1VZ2YGEttgWrRZyAWX8VRHG3Abf_OrXGM`

## Configuration

Each script project has a configuration object (typically `RUN_CONFIG`) with test flags:

```javascript
const RUN_CONFIG = {
  SKIP_EMAIL_TEST: true,   // Set to false to send test emails
  SKIP_DBASE_TEST: true,   // Set to false to run database tests
  daysBack: 7,             // Days back to search for emails
  maxEmails: 50            // Maximum emails to process per run
};
```

**Production mode:** Both `SKIP_*` flags set to `true`
**Development/testing:** Set flags to `false` to enable test behaviors

## Deployment Guide

### Updating a Script

1. Make changes to the `.gs` file in this repo
2. Copy the updated code to script.google.com
3. Save and test in the Apps Script editor
4. Deploy as a new version if needed

### Setting Up Triggers

1. Open the script project at script.google.com
2. Click the clock icon (Triggers) in the left sidebar
3. Click "Add Trigger"
4. Configure:
   - Function to run: `triggerNewBookingsScan` (or similar)
   - Event source: Time-driven
   - Type: Minutes timer / Hour timer (as appropriate)
   - Interval: Every 5 minutes (or as needed)

### Calling Scripts from Reception App

The `apps/reception/` app calls these scripts via HTTP:

```typescript
// Example from apps/reception/src/services/
const SCRIPT_URL = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;
const response = await fetch(`${SCRIPT_URL}?action=getStats`);
```

**Security note:** Script deployment IDs should be moved to environment variables (flagged in security audit).

## Directory Structure

```
apps/brikette-scripts/
├── README.md                    # This file
├── package.json                 # Minimal package for monorepo integration
├── docs/
│   ├── deployment-ids.md        # Reference for all deployment IDs
│   └── booking-monitor-architecture.md  # Architecture notes for booking monitor
└── src/
    ├── booking-monitor/         # Booking email scanning and welcome emails
    │   ├── _RunBookingMonitor.gs       # Entry point, config, trigger
    │   ├── _BookingUtilities.gs        # Email parsing, data transformation
    │   ├── _BookingImporterEmail.gs    # Email body generation (HTML + text)
    │   ├── _EmailsHelper.gs            # Formatting helpers, room details
    │   └── _EmailsConfig.gs            # Colors, styles, branding, templates
    ├── guest-email/             # Guest communications
    ├── alloggiati/              # Italian registration
    └── statistics/              # Analytics scripts
```

## File Naming Convention

Google Apps Script projects typically use these conventions:
- `_Run*.gs` - Entry point files with triggers and main config
- `Code.gs` - Main logic (if single-file project)
- Descriptive names for specific functionality

The underscore prefix (`_`) often indicates a primary/entry file.

## Related Documentation

- **BRIK-ENG-0020:** Email Autodraft Response System (uses these scripts as foundation)
- **Security audit:** `docs/security-audit-2026-01.md` (notes on hardcoded deployment IDs)
- **Reception app:** `apps/reception/` (consumes these scripts via HTTP)

## Integration with Email Autodraft System

The BRIK-ENG-0020 project will extend these existing scripts to:
1. Classify incoming booking inquiries
2. Generate draft responses using Claude API
3. Store drafts in Gmail for Pete's review

See `docs/business-os/cards/BRIK-ENG-0020.agent.md` for the full project specification.
