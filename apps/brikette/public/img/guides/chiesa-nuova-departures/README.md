# Images for Chiesa Nuova Departures Guide

## Attribution Table

All images must be sourced from Wikimedia Commons with clear licenses that allow commercial use.

| Filename | Source URL | Author | License | Notes |
|----------|------------|---------|---------|-------|
| bar-internazionale.webp | [Wikimedia Commons File URL] | [Author Name] | [CC BY-SA 4.0] | Exterior view of Bar Internazionale with red awning |
| sita-bus-stop-sign.webp | [Wikimedia Commons File URL] | [Author Name] | [CC BY 3.0] | Blue and white SITA bus stop sign |
| sita-bus-coastal.webp | [Wikimedia Commons File URL] | [Author Name] | [CC BY-SA 4.0] | SITA bus on Amalfi Coast road |
| positano-bus-ticket.webp | [Wikimedia Commons File URL] | [Author Name] | [CC0 / Public Domain] | SITA bus ticket or tabacchi shop |
| bus-validator.webp | [Wikimedia Commons File URL] | [Author Name] | [CC BY 4.0] | Electronic ticket validator inside bus |
| summer-queue.webp | [Wikimedia Commons File URL] | [Author Name] | [CC BY-SA 3.0] | Passengers waiting for bus in summer |
| bus-luggage.webp | [Wikimedia Commons File URL] | [Author Name] | [CC BY 4.0] | Luggage compartment or passengers with bags |
| viale-pasitea.webp | [Wikimedia Commons File URL] | [Author Name] | [CC BY-SA 4.0] | Sidewalk along Viale Pasitea |

## Image Sourcing Instructions

### 1. Find Images on Wikimedia Commons

Visit these categories:
- https://commons.wikimedia.org/wiki/Category:Positano
- https://commons.wikimedia.org/wiki/Category:Buses_in_Campania
- https://commons.wikimedia.org/wiki/Category:Amalfi_Coast

Search for:
- "Positano street" or "Viale Pasitea" (for sidewalk/street views)
- "SITA bus" or "Italian bus" (for bus images)
- "Italian bus stop" (for stop signs)
- "Positano" (general town views that show the road/area)

### 2. Check License

**Acceptable licenses:**
- CC0 (Public Domain) - No attribution required but recommended
- CC BY (any version) - Attribution required
- CC BY-SA (any version) - Attribution required, share-alike

**NOT acceptable:**
- CC BY-NC (Non-Commercial)
- CC BY-ND (No Derivatives)
- All Rights Reserved
- Unknown/unclear license

### 3. Download and Convert

For each image:

```bash
# Download from Wikimedia Commons (use the full resolution link)
wget "https://commons.wikimedia.org/wiki/Special:FilePath/[Filename]?width=2000" -O original.jpg

# Convert to WebP (requires cwebp tool)
cwebp -q 85 original.jpg -o [target-filename].webp

# Or use ImageMagick
convert original.jpg -quality 85 [target-filename].webp
```

Target file size: <500KB when possible, without sacrificing quality.

### 4. Record Attribution

For each image, record on the file page:
- Full Wikimedia Commons file page URL (e.g., `https://commons.wikimedia.org/wiki/File:Example.jpg`)
- Author/photographer name
- License name and license URL
- Any special notes about the image

### 5. Update the Guide JSON

Add the image to:
1. The relevant section's `images[]` array (inline placement)
2. The root-level `gallery[]` array (for audit compatibility)

See the guide file for the JSON structure.

## Caption Format

```
[Human-readable description] — Photo: %URL:[Commons File URL]|[Author Name]% (%URL:[License URL]|[License Name]%) via Wikimedia Commons
```

Example:
```
Bar Internazionale with its distinctive red awning marks the Chiesa Nuova bus stop — Photo: %URL:https://commons.wikimedia.org/wiki/File:Positano_Bar.jpg|Marco Rossi% (%URL:https://creativecommons.org/licenses/by-sa/4.0|CC BY-SA 4.0%) via Wikimedia Commons
```

## License URLs (Quick Reference)

- CC0: https://creativecommons.org/publicdomain/zero/1.0/
- CC BY 3.0: https://creativecommons.org/licenses/by/3.0/
- CC BY 4.0: https://creativecommons.org/licenses/by/4.0/
- CC BY-SA 3.0: https://creativecommons.org/licenses/by-sa/3.0/
- CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/

## Notes

- All images must be placed in this directory: `public/img/guides/chiesa-nuova-departures/`
- Use descriptive filenames in kebab-case (e.g., `bar-internazionale.webp`)
- Recommended dimensions: 1200-2000px wide
- Format: WebP preferred (fallback to JPEG/PNG if needed)
- Update this README with actual attribution info once images are added
