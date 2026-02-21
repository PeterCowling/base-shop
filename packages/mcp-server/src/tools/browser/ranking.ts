import type { BicAffordance } from "./bic.js";

const LANDMARK_WEIGHT: Readonly<Record<BicAffordance["landmark"], number>> = {
  modal: 500,
  banner: 450,
  main: 400,
  nav: 200,
  footer: 150,
  unknown: 0,
};

function affordanceKey(a: BicAffordance): string {
  const href = a.href ? `|${a.href}` : "";
  return `${a.role}|${a.name}${href}`;
}

export function rankAffordances(input: {
  affordances: ReadonlyArray<BicAffordance>;
}): ReadonlyArray<BicAffordance> {
  const bestLandmarkByKey = new Map<string, number>();
  for (const a of input.affordances) {
    const key = affordanceKey(a);
    const weight = LANDMARK_WEIGHT[a.landmark] ?? 0;
    const prev = bestLandmarkByKey.get(key);
    if (prev === undefined || weight > prev) {
      bestLandmarkByKey.set(key, weight);
    }
  }

  const scored = input.affordances.map((a, idx) => {
    const landmarkWeight = LANDMARK_WEIGHT[a.landmark] ?? 0;
    const bestLandmark = bestLandmarkByKey.get(affordanceKey(a)) ?? landmarkWeight;

    // Conservative, deterministic ranking:
    // - modal/banner > main > nav/footer
    // - visible + enabled preferred
    // - repeated nav/footer items that also exist in a higher landmark get a penalty
    let score = 0;
    score += landmarkWeight;
    score += a.visible ? 50 : 0;
    score += a.disabled ? 0 : 10;

    const isNavOrFooter = a.landmark === "nav" || a.landmark === "footer";
    if (isNavOrFooter && bestLandmark > landmarkWeight) {
      score -= 150;
    }

    return { a, idx, score };
  });

  scored.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    // Stable tie-break: preserve input order deterministically.
    return left.idx - right.idx;
  });

  return scored.map((s) => s.a);
}

type CursorPayload = { offset: number };

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as CursorPayload;
    if (!parsed || typeof parsed.offset !== "number" || !Number.isFinite(parsed.offset) || parsed.offset < 0) {
      return null;
    }
    return { offset: Math.floor(parsed.offset) };
  } catch {
    return null;
  }
}

export function paginateAffordances(input: {
  affordances: ReadonlyArray<BicAffordance>;
  maxAffordances: number;
  cursor?: string;
}): { items: ReadonlyArray<BicAffordance>; hasMore: boolean; nextCursor?: string } {
  const max = Math.max(0, Math.floor(input.maxAffordances));
  const decoded = input.cursor ? decodeCursor(input.cursor) : null;
  const offset = decoded?.offset ?? 0;

  const items = input.affordances.slice(offset, offset + max);
  const nextOffset = offset + items.length;
  const hasMore = nextOffset < input.affordances.length;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? encodeCursor({ offset: nextOffset }) : undefined,
  };
}

