# Implementation Guide: Adding Images to Chiesa Nuova Departures Guide

## Current Status

✅ Directory created: `public/img/guides/chiesa-nuova-departures/`
✅ Attribution README template created
⏳ Images need to be sourced from Wikimedia Commons
⏳ Guide JSON needs to be updated with image references

## Required Images (8 total)

The audit requires 8+ images. Here's what we need for each section:

### 1. Section: "why-route"
**Image 1: Bar Internazionale Exterior**
- **Search:** "Positano cafe" OR "Bar Internazionale" on Wikimedia Commons
- **Filename:** `bar-internazionale.webp`
- **Alt:** "Bar Internazionale with red awning on Viale Pasitea in Positano"
- **Caption:** "Bar Internazionale with its distinctive red awning marks the Chiesa Nuova bus stop"

**Image 2: Viale Pasitea Sidewalk**
- **Search:** "Viale Pasitea" OR "Positano street" on Wikimedia Commons
- **Filename:** `viale-pasitea-sidewalk.webp`
- **Alt:** "Wide paved sidewalk along Viale Pasitea in Positano suitable for luggage"
- **Caption:** "The wide, well-lit sidewalk along Viale Pasitea makes the 2-minute walk easy even with luggage"

### 2. Section: "where-buses-go"
**Image 3: SITA Bus on Coastal Road**
- **Search:** "SITA bus Amalfi Coast" OR "Italian coastal bus" on Wikimedia Commons
- **Filename:** `sita-bus-coastal-road.webp`
- **Alt:** "SITA bus traveling along the scenic Amalfi Coast road"
- **Caption:** "SITA buses run frequently along the dramatic coastal road between Positano, Amalfi, and Sorrento"

### 3. Section: "bus-schedules"
**Image 4: Bus Timetable/Schedule**
- **Search:** "Italian bus schedule" OR "SITA timetable" on Wikimedia Commons
- **Filename:** `bus-schedule-post.webp`
- **Alt:** "SITA bus schedule posted at Positano bus stop"
- **Caption:** "Check the current SITA schedule posted at the stop or at Bar Internazionale"

### 4. Section: "bus-basics"
**Image 5: SITA Bus Ticket**
- **Search:** "Italian bus ticket" OR "SITA ticket" on Wikimedia Commons
- **Filename:** `sita-bus-ticket.webp`
- **Alt:** "SITA bus ticket showing fare and route information"
- **Caption:** "Buy SITA tickets at the tabacchi or inside Bar Internazionale before boarding"

**Image 6: Ticket Validator**
- **Search:** "bus ticket validator" OR "Italian bus interior" on Wikimedia Commons
- **Filename:** `ticket-validator.webp`
- **Alt:** "Electronic ticket validator inside SITA bus"
- **Caption:** "Validate your ticket when boarding by showing it to the driver or scanning it at the validator"

### 5. Section: "boarding-tips"
**Image 7: Summer Bus Queue**
- **Search:** "bus queue Italy" OR "waiting passengers bus" on Wikimedia Commons
- **Filename:** `summer-queue.webp`
- **Alt:** "Passengers queuing for SITA bus during busy summer season"
- **Caption:** "Arrive 10-15 minutes early in summer to secure your spot in the queue"

**Image 8: Bus with Luggage**
- **Search:** "bus luggage" OR "backpacker bus" on Wikimedia Commons
- **Filename:** `bus-luggage-space.webp`
- **Alt:** "Limited luggage storage compartment on SITA bus"
- **Caption:** "Luggage space is limited—board early if you have large bags"

## JSON Structure to Add

For each section with images, add an `images` array like this:

```json
{
  "id": "why-route",
  "title": "Why this route works",
  "body": ["..."],
  "images": [
    {
      "src": "/img/guides/chiesa-nuova-departures/bar-internazionale.webp",
      "alt": "Bar Internazionale with red awning on Viale Pasitea in Positano",
      "caption": "Bar Internazionale with its distinctive red awning marks the Chiesa Nuova bus stop — Photo: %URL:https://commons.wikimedia.org/wiki/File:Example.jpg|Author Name% (%URL:https://creativecommons.org/licenses/by-sa/4.0|CC BY-SA 4.0%) via Wikimedia Commons",
      "width": 1600,
      "height": 1067
    }
  ]
}
```

## Gallery Array (for Audit)

Also add a `gallery` array at the root level with all 8 images:

```json
{
  "seo": {...},
  "gallery": [
    {
      "src": "/img/guides/chiesa-nuova-departures/bar-internazionale.webp",
      "alt": "Bar Internazionale with red awning on Viale Pasitea in Positano",
      "caption": "Bar Internazionale with its distinctive red awning — Photo: %URL:...|Author% (%URL:...|License%) via Wikimedia Commons"
    },
    ...// 7 more images
  ],
  "sections": [...]
}
```

## Step-by-Step Implementation

### Phase 1: Source Images (Manual)

1. Visit https://commons.wikimedia.org/wiki/Category:Positano
2. For each of the 8 required images:
   - Find a suitable image matching the description
   - Check license (must be CC0, CC BY, or CC BY-SA)
   - Click on the image to open the file page
   - Record: File URL, Author name, License name + URL
   - Download full resolution image
   - Convert to WebP: `cwebp -q 85 input.jpg -o [filename].webp`
   - Save to `public/img/guides/chiesa-nuova-departures/`
3. Update `README.md` attribution table with actual details

### Phase 2: Update Guide JSON

1. Open `/Users/petercowling/base-shop/apps/brikette/src/locales/en/guides/content/chiesaNuovaDepartures.json`
2. Add `images` arrays to sections as shown above
3. Add root-level `gallery` array with all 8 images
4. Ensure captions include proper %URL: token attribution

### Phase 3: Localize

For each of the 15 non-EN locales:
- Copy the image arrays (src, alt, width, height stay same)
- Translate only the human-readable part of captions (before the em-dash)
- Keep the attribution (after the em-dash) exactly the same

### Phase 4: Verify

1. Run audit: `pnpm tsx scripts/run-audit-temp.ts chiesaNuovaDepartures`
2. Check that `imageCount` metric shows 8
3. Verify score improvement (should go from 7.9 → 9.0+)
4. Test guide renders correctly in browser

## Alternative: Use Existing Project Images

If finding Wikimedia Commons images proves difficult, check if the project already has suitable images:

```bash
ls public/img/directions/ | grep -i bus
ls public/img/directions/ | grep -i positano
```

If suitable images exist, they can be symlinked or referenced directly (but still need proper attribution added to captions).

## Estimated Impact

Adding 8 properly attributed images should:
- Fix the "Too few images (0, need 8+)" issue (-0.5 points)
- Bring final score from 7.9 → 8.4+ (possibly 9.0+ if other fixes applied)
- Make guide eligible for "live" status (requires 9.0+)

## Questions?

See the main README.md in this directory for detailed attribution guidelines and license information.
