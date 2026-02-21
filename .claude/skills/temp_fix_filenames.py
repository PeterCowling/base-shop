#!/usr/bin/env python3
"""
Fix incorrectly replaced filename references in Fact-Find: fields.
"""
import re
from pathlib import Path

def fix_file(file_path):
    """Fix a single file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Fix: Fact-Find: docs/plans/xxx-lp-fact-find.md → xxx-fact-find.md
    content = re.sub(
        r'(Fact-Find:.*)-lp-fact-find\.md',
        r'\1-fact-find.md',
        content
    )

    # Fix: Related-Plan: docs/plans/xxx-lp-fact-find.md → xxx-fact-find.md
    content = re.sub(
        r'(Related-Plan:.*)-lp-fact-find\.md',
        r'\1-fact-find.md',
        content
    )

    # Fix: Related-Plan: docs/plans/xxx-lp-plan.md → xxx-plan.md
    content = re.sub(
        r'(Related-Plan:.*)-lp-plan\.md',
        r'\1-plan.md',
        content
    )

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    """Process all files."""
    plans_dir = Path('/Users/petercowling/base-shop/docs/plans')

    modified_count = 0
    for md_file in plans_dir.rglob('*.md'):
        if fix_file(md_file):
            modified_count += 1
            print(f"Fixed: {md_file.relative_to(plans_dir)}")

    print(f"\nFixed {modified_count} files")

if __name__ == '__main__':
    main()
