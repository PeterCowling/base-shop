#!/usr/bin/env python3
"""Fix structural mismatches for Batch 1-2 guides by restoring EN structure."""

import json
import sys
from pathlib import Path

# Guides to fix with their expected section counts
GUIDES_TO_FIX = {
    "fornilloBeachGuide": 9,
    "santaMariaDelCastelloHike": 6,
    "arienzoBeachClub": 9,
    "parking": 6,
    "reginaGiovannaBath": 7,
    "positanoMainBeach": 11
}

locales = ['ar', 'da', 'de', 'es', 'fr', 'hi', 'hu', 'it', 'ja', 'ko', 'no', 'pl', 'pt', 'ru', 'sv', 'vi', 'zh']

total_fixed = 0

for guide_key, expected_sections in GUIDES_TO_FIX.items():
    print(f"\n{'='*60}")
    print(f"Processing {guide_key} (expected: {expected_sections} sections)")
    print(f"{'='*60}")
    
    # Read EN source
    en_path = Path(f"src/locales/en/guides/content/{guide_key}.json")
    if not en_path.exists():
        print(f"  ✗ EN file not found, skipping")
        continue
        
    with open(en_path) as f:
        en_data = json.load(f)
    
    en_sections = len(en_data.get("sections", []))
    if en_sections != expected_sections:
        print(f"  ⚠ Warning: EN has {en_sections} sections, expected {expected_sections}")
    
    # Fix each locale
    for locale in locales:
        locale_path = Path(f"src/locales/{locale}/guides/content/{guide_key}.json")
        
        if not locale_path.exists():
            print(f"  ✗ {locale}: file missing")
            continue
        
        with open(locale_path) as f:
            locale_data = json.load(f)
        
        locale_sections = len(locale_data.get("sections", []))
        
        if locale_sections == en_sections:
            print(f"  ✓ {locale}: already correct ({locale_sections} sections)")
            continue
        
        # Start with EN structure
        fixed_data = json.loads(json.dumps(en_data))  # Deep copy
        
        # Preserve existing translated fields
        if "seo" in locale_data:
            fixed_data["seo"] = locale_data["seo"]
        if "linkLabel" in locale_data:
            fixed_data["linkLabel"] = locale_data["linkLabel"]
        if "intro" in locale_data:
            fixed_data["intro"] = locale_data["intro"]
        if "lastUpdated" in locale_data:
            fixed_data["lastUpdated"] = locale_data["lastUpdated"]
        
        # Preserve existing section translations where they exist
        if "sections" in locale_data:
            locale_sections_by_id = {s.get("id"): s for s in locale_data.get("sections", [])}
            for i, section in enumerate(fixed_data.get("sections", [])):
                section_id = section.get("id")
                if section_id in locale_sections_by_id:
                    locale_section = locale_sections_by_id[section_id]
                    if "title" in locale_section:
                        fixed_data["sections"][i]["title"] = locale_section["title"]
                    if "body" in locale_section:
                        fixed_data["sections"][i]["body"] = locale_section["body"]
                    if "list" in locale_section:
                        fixed_data["sections"][i]["list"] = locale_section["list"]
                    if "images" in locale_section:
                        fixed_data["sections"][i]["images"] = locale_section["images"]
        
        # Preserve other common fields
        for field in ["toc", "images", "essentialsTitle", "essentials", "typicalCostsTitle", 
                     "typicalCosts", "tipsTitle", "tips", "warningsTitle", "warnings", 
                     "faqsTitle", "faqs", "fallback"]:
            if field in locale_data:
                fixed_data[field] = locale_data[field]
        
        # Write fixed file
        with open(locale_path, "w") as f:
            json.dump(fixed_data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        
        print(f"  ✓ {locale}: fixed {locale_sections} → {en_sections} sections")
        total_fixed += 1

print(f"\n{'='*60}")
print(f"Summary: Fixed {total_fixed} locale files")
print(f"{'='*60}")
