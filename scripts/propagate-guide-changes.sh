#!/bin/bash

# Script to propagate guide changes to all locales
# Applies technical changes (image swaps) that are identical across locales

set -e

LOCALES_DIR="apps/brikette/src/locales"
LOCALES="ar da de es fr hi hu it ja ko no pl pt ru sv vi zh"

echo "Propagating guide changes to all locales..."

# Apply changes to positanoMainBeach.json
for locale in $LOCALES; do
  file="$LOCALES_DIR/$locale/guides/content/positanoMainBeach.json"
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Swap image paths in getting-there section
    # First swap: positanoMainBeach.jpg <-> interno-positano-bus.jpg
    sed -i.bak \
      -e 's|/img/guides/topics/positanoMainBeach\.jpg|__TEMP_PLACEHOLDER__|g' \
      -e 's|/img/guides/positano-main-beach-bus-back/interno-positano-bus\.jpg|/img/guides/topics/positanoMainBeach.jpg|g' \
      -e 's|__TEMP_PLACEHOLDER__|/img/guides/positano-main-beach-bus-back/interno-positano-bus.jpg|g' \
      "$file"

    # Second swap: 01-beach-layout-map.jpg <-> 02-beach-providers-overview.jpg
    sed -i.bak2 \
      -e 's|/img/guides/positano-main-beach/01-beach-layout-map\.jpg|__TEMP_PLACEHOLDER__|g' \
      -e 's|/img/guides/positano-main-beach/02-beach-providers-overview\.jpg|/img/guides/positano-main-beach/01-beach-layout-map.jpg|g' \
      -e 's|__TEMP_PLACEHOLDER__|/img/guides/positano-main-beach/02-beach-providers-overview.jpg|g' \
      "$file"

    # Clean up backup files
    rm -f "$file.bak" "$file.bak2"
  fi
done

echo "Image path swaps completed for all locales!"
echo ""
echo "Note: Text translations for the following still need to be applied:"
echo "  1. positanoBeaches.json - 'logistics' section title and body"
echo "  2. lauritoBeachGuide.json - image caption"
echo ""
echo "These require translation and should be handled separately."
