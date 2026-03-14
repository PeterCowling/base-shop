/**
 * Parser for Prime pipe-delimited order strings.
 *
 * Converts the strings produced by buildBreakfastOrderValue() and
 * buildEvDrinkOrderValue() into structured bar order items for writing
 * to Firebase at barOrders/{type}/{monthName}/{day}/{txnId}.
 *
 * All preorder items are complimentary (price: 0).
 */

export interface SalesOrderItem {
  product: string;
  count: number;
  lineType: 'kds' | 'bds';
  price: number;
}

export interface ParsedOrder {
  preorderTime: string;
  items: SalesOrderItem[];
}

/**
 * Parse a pipe-delimited breakfast order string into structured bar items.
 *
 * Breakfast segment order (from buildBreakfastOrderValue):
 *   1. Food — "Eggs (EggStyle)" | "Pancakes (SyrupLabel)" | food label → lineType: "kds"
 *   2. Sides — comma-separated side values (Eggs only) → individual items, lineType: "bds"
 *   3. Drink — drink label + modifiers (comma-joined) → single item, lineType: "bds"
 *   4. Time — "HH:MM" (always last segment)
 *
 * For Pancakes and other foods there is no sides segment:
 *   1. Food → lineType: "kds"
 *   2. Drink → lineType: "bds"
 *   3. Time
 *
 * The time segment is always the LAST pipe segment.
 *
 * @example
 * parseBreakfastOrderString("Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00")
 * // → { preorderTime: "09:00", items: [
 * //     { product: "Eggs (Scrambled)", count: 1, lineType: "kds", price: 0 },
 * //     { product: "Bacon", count: 1, lineType: "bds", price: 0 },
 * //     { product: "Ham", count: 1, lineType: "bds", price: 0 },
 * //     { product: "Toast", count: 1, lineType: "bds", price: 0 },
 * //     { product: "Americano, Oat Milk, No Sugar", count: 1, lineType: "bds", price: 0 },
 * //   ] }
 *
 * @example
 * parseBreakfastOrderString("Pancakes (Nutella Chocolate Sauce) | Green Tea | 08:30")
 * // → { preorderTime: "08:30", items: [
 * //     { product: "Pancakes (Nutella Chocolate Sauce)", count: 1, lineType: "kds", price: 0 },
 * //     { product: "Green Tea", count: 1, lineType: "bds", price: 0 },
 * //   ] }
 */
export function parseBreakfastOrderString(value: string): ParsedOrder {
  if (!value || !value.trim()) {
    console.warn('[preorder-parser] parseBreakfastOrderString: empty input'); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return { preorderTime: '00:00', items: [] };
  }

  const segments = value.split('|').map((s) => s.trim()).filter(Boolean);

  // Time is always the last segment — detect by HH:MM pattern
  const TIME_RE = /^\d{1,2}:\d{2}$/;
  const lastSeg = segments[segments.length - 1] ?? '';
  const preorderTime = TIME_RE.test(lastSeg) ? lastSeg : '00:00';

  if (!TIME_RE.test(lastSeg)) {
    console.warn('[preorder-parser] parseBreakfastOrderString: no time segment found in:', value); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
  }

  // Segments without the time segment
  const contentSegments = TIME_RE.test(lastSeg) ? segments.slice(0, -1) : segments;

  if (contentSegments.length === 0) {
    console.warn('[preorder-parser] parseBreakfastOrderString: no content segments in:', value); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return { preorderTime, items: [] };
  }

  const items: SalesOrderItem[] = [];

  // Segment 0: food item → kds
  const foodSeg = contentSegments[0] ?? '';
  if (foodSeg) {
    items.push({ product: foodSeg, count: 1, lineType: 'kds', price: 0 });
  }

  // Remaining content segments
  // If there are 3 content segments: [food, sides, drink]
  // If there are 2 content segments: [food, drink]
  if (contentSegments.length === 3) {
    // Segment 1: sides (comma-separated) → individual bds items
    const sidesSeg = contentSegments[1] ?? '';
    for (const side of sidesSeg.split(',').map((s) => s.trim()).filter(Boolean)) {
      items.push({ product: side, count: 1, lineType: 'bds', price: 0 });
    }
    // Segment 2: drink + modifiers → single bds item
    const drinkSeg = contentSegments[2] ?? '';
    if (drinkSeg) {
      items.push({ product: drinkSeg, count: 1, lineType: 'bds', price: 0 });
    }
  } else if (contentSegments.length >= 2) {
    // Segment 1: drink + modifiers → single bds item (no sides segment)
    const drinkSeg = contentSegments[1] ?? '';
    if (drinkSeg) {
      items.push({ product: drinkSeg, count: 1, lineType: 'bds', price: 0 });
    }
  }

  return { preorderTime, items };
}

/**
 * Parse a pipe-delimited evening drink order string into structured bar items.
 *
 * Evening drink segment order (from buildEvDrinkOrderValue):
 *   1. Drink + modifiers (comma-joined) → single item, lineType: "bds"
 *   2. Time — "HH:MM" (last segment)
 *
 * @example
 * parseEvDrinkOrderString("Aperol Spritz | 19:30")
 * // → { preorderTime: "19:30", items: [
 * //     { product: "Aperol Spritz", count: 1, lineType: "bds", price: 0 },
 * //   ] }
 *
 * @example
 * parseEvDrinkOrderString("Americano, With Milk, With Sugar | 19:00")
 * // → { preorderTime: "19:00", items: [
 * //     { product: "Americano, With Milk, With Sugar", count: 1, lineType: "bds", price: 0 },
 * //   ] }
 */
export function parseEvDrinkOrderString(value: string): ParsedOrder {
  if (!value || !value.trim()) {
    console.warn('[preorder-parser] parseEvDrinkOrderString: empty input'); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return { preorderTime: '00:00', items: [] };
  }

  const segments = value.split('|').map((s) => s.trim()).filter(Boolean);

  const TIME_RE = /^\d{1,2}:\d{2}$/;
  const lastSeg = segments[segments.length - 1] ?? '';
  const preorderTime = TIME_RE.test(lastSeg) ? lastSeg : '00:00';

  if (!TIME_RE.test(lastSeg)) {
    console.warn('[preorder-parser] parseEvDrinkOrderString: no time segment found in:', value); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
  }

  // Segment 0: drink + modifiers → single bds item
  const drinkSeg = segments[0] ?? '';

  // If drinkSeg is the time segment itself (only one segment), return empty
  if (!drinkSeg || TIME_RE.test(drinkSeg)) {
    console.warn('[preorder-parser] parseEvDrinkOrderString: no drink segment in:', value); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return { preorderTime, items: [] };
  }

  const items: SalesOrderItem[] = [
    { product: drinkSeg, count: 1, lineType: 'bds', price: 0 },
  ];

  return { preorderTime, items };
}
