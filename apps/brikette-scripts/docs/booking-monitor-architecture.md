# Booking Monitor Architecture

## Overview

The Booking Monitor is a Google Apps Script system that:
1. Scans Gmail for new booking notification emails
2. Extracts reservation data using regex patterns
3. Generates personalized welcome emails (HTML + plain text)
4. Sends emails to guests with booking details

## File Structure and Responsibilities

### `_RunBookingMonitor.gs` - Entry Point
- Defines `RUN_CONFIG` object (test flags, search parameters)
- Exposes `triggerNewBookingsScan()` as the trigger function
- Calls `scanNewEmailsForBookings()` with config

### `_BookingUtilities.gs` - Data Extraction
The `BookingUtilities` object handles all email parsing and data transformation:

**Key Functions:**
- `extractEmailReservationData(body, timestamp)` - Main parser, returns structured reservation object
- `_extractField(body, regexArray)` - Tries multiple regex patterns to extract a field
- `_parseAndConvertDate(dateStr)` - Handles multiple date formats (DD/MM/YYYY, DD-MM-YYYY)
- `_parsePrice(priceRaw)` - Parses prices with European formatting (1.234,56 vs 1,234.56)
- `_extractRoomLines(body, nonRefundRegex)` - Extracts room information from HTML tables
- `parseRoomsAndGuests(roomString)` - Parses room string into room numbers and guest count
- `parseAndFormatName(rawName)` - Splits name into firstName/lastName (note: swaps order)

**Business Logic:**
- Hostelworld commission deduction (15% on codes starting with `7763-`)
- Room 7 special case: assumes 2 guests (double room)

### `_EmailsHelper.gs` - Formatting Utilities
The `EmailsHelper` module (IIFE pattern) provides email formatting helpers:

**Key Functions:**
- `formatName(name)` - Simple null-safe name formatting
- `determineBookingSource(reservationCode)` - Identifies source by code length
- `determinePaymentTermsContent(terms, reservationCode)` - Returns payment terms text
- `formatDateForEmail(dateInput)` - Formats dates with ordinals ("1st of January, 2026")
- `getRoomDescription(rn)` - Returns room type/facilities (cached)
- `getBedDescription(rn)` - Returns bed configuration (cached)
- `getRoomView(rn)` - Returns view description (cached)

**Caching:**
Uses in-memory caches (`roomDescCache`, `bedDescCache`, `roomViewCache`) for room lookups.

### `_BookingImporterEmail.gs` - Email Generation
The `EmailsText` object generates the actual email content:

**Key Functions:**
- `Activity_1_generate(extractedInfo)` - Generates HTML email body
- `Activity_1_generatePlainText(extractedInfo)` - Generates plain text version

**Email Structure:**
1. Header (from EmailsConfig)
2. Greeting ("Dear {name},")
3. Introduction paragraph
4. Action Required block (conditional)
5. Digital Assistant links section (occupant links)
6. Booking details table
7. Room details table(s)
8. Signature (from EmailsConfig)
9. Footer (from EmailsConfig)

### `_EmailsConfig.gs` - Branding, Styling & Templates
The `EmailsConfig` object centralizes all email branding, styling, and reusable template components.

**URLs & External Links:**
- `hostelUrl` - Main website: `http://www.hostel-positano.com`
- `instagramUrl` - Instagram profile
- `tiktokUrl` - TikTok hashtag page
- `termsUrl` - Terms and conditions (Google Doc)

**Image Assets (with AVIF optimization):**
All images are stored on Google Drive with both PNG and AVIF versions:
- `hostelIconImg` / `hostelIconImgAvif` - Hostel logo icon
- `criSignImg` / `criSignImgAvif` - Cristiana's handwritten signature
- `peteSignImg` / `peteSignImgAvif` - Peter's handwritten signature
- `instagramImg` / `instagramImgAvif` - Instagram icon
- `tiktokImg` / `tiktokImgAvif` - TikTok icon

**AVIF Fallback Pattern:**
```javascript
getAvifFallbackImage(avifUrl, pngUrl, altText, styleStr)
// Returns:
// <picture>
//   <source srcset="${avifUrl}" type="image/avif">
//   <source srcset="${pngUrl}" type="image/png">
//   <img src="${pngUrl}" alt="${altText}" style="${styleStr}">
// </picture>
```
This pattern provides modern image format optimization while maintaining compatibility with older email clients that don't support AVIF.

**Color Schemes:**
```javascript
ColorSchemes: {
  yellow: {
    bgColourHeader: "#ffc107",    // Amber header background
    bgColourMain: "#fff3cd",      // Light yellow main content
    bgColourSignature: "#ffeeba", // Slightly darker signature section
    bgColourFooter: "#fff3cd",    // Footer matches main content
    textColourMain: "#856404"     // Dark amber text for readability
  }
}
```

**Activity-to-Color Mapping:**
```javascript
ActivityColors: { 1: "yellow" }  // Activity 1 (booking confirmation) uses yellow scheme
```
This extensible pattern allows different email types to use different color schemes.

**Style Generator:**
`getStyles(colors)` returns a comprehensive CSS-in-JS object with 25+ named style strings:
- `bodyStyle`, `contentStyle` - Layout fundamentals
- `headerStyle`, `headerInnerStyle`, `headerTextStyle`, etc. - Header components
- `mainContentStyle`, `paragraphStyle` - Body content
- `signatureSectionStyle`, `signatureTextStyle`, `signatureImageStyle`, etc. - Signature block
- `footerInfoStyle`, `footerHeadingStyle`, `socialLinksContainerStyle`, etc. - Footer components

**Template Generators:**
- `generateHeader(styles)` - Branded header with hostel name ("Hostel Brikette - Positano") and linked logo
- `generateSignature(styles)` - Professional dual-owner signature block with handwritten signatures, names, and titles
- `generateFooter(styles)` - Direct booking CTA, terms link, and social media icons (Instagram, Website, TikTok)

**Utility:**
- `months` - Array of month names for date formatting

## Data Flow

```
Gmail Inbox
    │
    ▼
[_RunBookingMonitor.gs]
triggerNewBookingsScan()
    │
    ▼
scanNewEmailsForBookings(config)
    │
    ├── Gmail search: "subject:booking" (or similar)
    │
    ▼
For each email:
    │
    ├── [_BookingUtilities.gs]
    │   extractEmailReservationData(body, timestamp)
    │       │
    │       ├── Extract: reservationCode, guestName, email
    │       ├── Extract: checkInDate, nights, totalPrice
    │       ├── Extract: room lines, refundable status
    │       ├── Apply: Hostelworld commission adjustment
    │       │
    │       └── Returns: {
    │             createTime, checkInDate, guestName,
    │             reservationCode, numberOfGuests, nights,
    │             roomString, totalPrice, email
    │           }
    │
    ├── [_EmailsHelper.gs]
    │   Enrich with:
    │       ├── determineBookingSource() → bookingSource
    │       ├── determinePaymentTermsContent() → paymentTerms
    │       ├── parseRoomsAndGuests() → roomNumbers, calculatedGuests
    │       └── Room details (description, beds, view)
    │
    ├── [_BookingImporterEmail.gs]
    │   EmailsText.Activity_1_generate(extractedInfo)
    │       │
    │       ├── [_EmailsConfig.gs] - Get styles and branding
    │       │   ├── ColorSchemes["yellow"] → color palette
    │       │   ├── getStyles(colors) → CSS-in-JS style objects
    │       │   ├── generateHeader(styles) → branded header HTML
    │       │   │   └── getAvifFallbackImage() → logo with AVIF fallback
    │       │   ├── generateSignature(styles) → owner signatures
    │       │   │   └── getAvifFallbackImage() → signature images
    │       │   └── generateFooter(styles) → terms + social links
    │       │       └── getAvifFallbackImage() → social icons
    │       │
    │       ├── Build main content (greeting, intro, details)
    │       ├── Conditionally include "Action Required" block
    │       ├── Include "Digital Assistant" links
    │       ├── Generate booking details table
    │       ├── Generate room details table(s)
    │       │
    │       └── Returns: Full HTML email body
    │
    └── Send via Gmail API
```

## Complete Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                        _RunBookingMonitor.gs                        │
│                    (Entry Point, Config, Trigger)                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       _BookingUtilities.gs                          │
│              (Email Parsing, Data Extraction)                       │
│  • extractEmailReservationData()                                    │
│  • parseRoomsAndGuests()                                            │
│  • Hostelworld commission calculation                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    _BookingImporterEmail.gs                         │
│           (HTML + Plain Text Email Generation)                      │
│  • EmailsText.Activity_1_generate()                                 │
│  • EmailsText.Activity_1_generatePlainText()                        │
└─────────────────────────────────────────────────────────────────────┘
            │                                       │
            ▼                                       ▼
┌───────────────────────────┐       ┌───────────────────────────────┐
│    _EmailsHelper.gs       │       │       _EmailsConfig.gs        │
│  (Formatting Utilities)   │       │   (Branding & Templates)      │
│                           │       │                               │
│ • formatDateForEmail()    │       │ • ColorSchemes (yellow, ...)  │
│ • determineBookingSource()│       │ • getStyles(colors)           │
│ • getRoomDescription()    │       │ • generateHeader(styles)      │
│ • getBedDescription()     │       │ • generateSignature(styles)   │
│ • getRoomView()           │       │ • generateFooter(styles)      │
│ • determinePaymentTerms() │       │ • getAvifFallbackImage()      │
│                           │       │ • Image URLs (PNG + AVIF)     │
│ [Cached lookups]          │       │ • Social/Website URLs         │
└───────────────────────────┘       └───────────────────────────────┘
```

## Key Business Rules

### Booking Source Detection
| Code Format | Source | Example |
|-------------|--------|---------|
| 10 digits | Booking.com | `1234567890` |
| 6 digits | Website | `123456` |
| Other (incl. `7763-*`) | Hostelworld | `7763-123456` |

### Payment Terms by Source

**Booking.com (10 digits):**
- Refundable: "Your reservation is refundable according to the terms of your booking. Payment can be made before or during check-in."
- Non-refundable: "Your booking is pre-paid and non-refundable."

**Other sources (Website, Hostelworld):**
- Refundable: "Payment is due upon arrival at the hostel."
- Non-refundable: "Your booking is pre-paid and non-refundable."

### Action Required Block
Only shown when:
- Booking is non-refundable AND
- Booking is NOT from Booking.com

Rationale: Booking.com handles its own payment/agreement flow.

### Hostelworld Commission
For codes starting with `7763-`:
```
netTotal = totalPrice - (totalPrice / 1.1 * 0.15)
```
- Assumes total includes 10% tax
- Deducts 15% commission on pre-tax amount

### Guest Count Estimation
- Room 7 (double room): 2 guests
- All other rooms: 1 guest per room segment

## Patterns Useful for Email Autodraft System

### 1. Multi-Version Email Generation
The system generates both HTML and plain text versions of each email. The autodraft system should follow this pattern for Gmail compatibility.

### 2. Conditional Content Blocks
The "Action Required" block is conditionally included based on business rules. The autodraft system can use similar patterns for:
- Language-specific content
- Booking type-specific sections
- Urgency indicators

### 3. Structured Data Tables
Email uses HTML tables with alternating row colors for readability. This pattern works well for:
- Pricing breakdowns
- Availability summaries
- FAQ responses

### 4. Mobile-Responsive Design
Uses viewport meta tag and inline styles for email client compatibility:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### 5. Cached Lookups
Room details use in-memory caching to avoid repeated computation. The autodraft system could cache:
- Website content
- Common FAQ answers
- Pricing information

### 6. External Link Integration
"Digital Assistant" links demonstrate integrating external services into emails. The autodraft system could similarly include:
- Booking links
- Website deep links
- Contact forms

## Captured Components Status

### Complete Components
- **`_RunBookingMonitor.gs`** - Entry point, config, trigger
- **`_BookingUtilities.gs`** - Email parsing, data extraction
- **`_BookingImporterEmail.gs`** - Email body generation (HTML + plain text)
- **`_EmailsHelper.gs`** - Formatting utilities, room details
- **`_EmailsConfig.gs`** - Branding, color schemes, templates (added 2026-02-01)

### Still Missing
- **Email Sending Logic** - The actual Gmail send logic is not in the captured files. Likely in a separate file or in `_RunBookingMonitor.gs` (full version).
- **Database/Spreadsheet Integration** - References to `SKIP_DBASE_TEST` suggest there's database or spreadsheet integration not yet captured.

## Future Enhancement Opportunities

1. **Template System**: Extract email structure into configurable templates
2. **Multi-language Support**: Add language detection and localized content
3. **A/B Testing**: Support multiple email versions for testing
4. **Analytics Integration**: Track email opens, clicks, conversions
5. **Error Handling**: Add robust error handling and logging
