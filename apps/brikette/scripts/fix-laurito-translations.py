#!/usr/bin/env python3
"""Fix lauritoBeachGuide translations by copying EN structure and preserving existing translations."""

import json
import sys
from pathlib import Path

# Read EN source
en_path = Path("src/locales/en/guides/content/lauritoBeachGuide.json")
with open(en_path) as f:
    en_data = json.load(f)

# Locales to fix (currently have condensed structures)
locales_to_fix = ["es", "de", "fr", "ko", "no", "pl", "sv", "vi", "zh"]

for locale in locales_to_fix:
    locale_path = Path(f"src/locales/{locale}/guides/content/lauritoBeachGuide.json")
    
    print(f"Processing {locale}...", file=sys.stderr)
    
    # Read existing locale file to preserve any existing translations
    with open(locale_path) as f:
        locale_data = json.load(f)
    
    # Start with EN structure
    fixed_data = json.loads(json.dumps(en_data))  # Deep copy
    
    # Preserve existing translated fields
    if "seo" in locale_data:
        fixed_data["seo"] = locale_data["seo"]
    if "linkLabel" in locale_data:
        fixed_data["linkLabel"] = locale_data["linkLabel"]
    if "intro" in locale_data:
        fixed_data["intro"] = locale_data["intro"]
    
    # Preserve existing section translations where they exist
    if "sections" in locale_data:
        locale_sections_by_id = {s.get("id"): s for s in locale_data.get("sections", [])}
        for i, section in enumerate(fixed_data.get("sections", [])):
            section_id = section.get("id")
            if section_id in locale_sections_by_id:
                # Use existing translation but keep EN structure as fallback
                locale_section = locale_sections_by_id[section_id]
                if "title" in locale_section:
                    fixed_data["sections"][i]["title"] = locale_section["title"]
                if "body" in locale_section:
                    fixed_data["sections"][i]["body"] = locale_section["body"]
                if "list" in locale_section:
                    fixed_data["sections"][i]["list"] = locale_section["list"]
    
    # Write fixed file
    with open(locale_path, "w") as f:
        json.dump(fixed_data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    
    print(f"✓ Fixed {locale}: now has {len(fixed_data.get('sections', []))} sections", file=sys.stderr)

print("Done!", file=sys.stderr)
