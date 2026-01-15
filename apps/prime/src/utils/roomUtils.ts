// src/utils/roomUtils.ts

import type { TFunction } from 'i18next';

interface RoomInfo {
  name: string;
  details: string;
}

/**
 * Hard‑wired English copy that acts as a last‑resort fallback.
 * Keys **must** match the numeric room IDs used in the database.
 */
const ROOM_DETAILS_MAP: Record<string, RoomInfo> = {
  '3': {
    name: 'Room 3 (Value All-Female, 8 beds)',
    details:
      'Our value all-female room has air conditioning, keycard door entry, and eight beds.',
  },
  '4': {
    name: 'Room 4 (Value All-Female, 8 beds)',
    details:
      'Our value all-female room has air conditioning, keycard door entry, and eight beds.',
  },
  '5': {
    name: 'Room 5 (Superior All-Female, 6 beds)',
    details:
      'Our superior all-female room has air conditioning, keycard door entry, an ensuite bathroom, seaview terrace, and six beds.',
  },
  '6': {
    name: 'Room 6 (Superior All-Female, 7 beds)',
    details:
      'Our superior all-female room has air conditioning, keycard door entry, an ensuite bathroom, seaview terrace, and seven beds.',
  },
  '7': {
    name: 'Room 7 (Double)',
    details:
      'Our double room has air conditioning, keycard door entry, an ensuite bathroom, and a sea-view terrace.',
  },
  '8': {
    name: 'Room 8 (Twin, All-Female)',
    details:
      'Our twin, all-female room is located next to the female bathrooms and has no sea view.',
  },
  '9': {
    name: 'Room 9 (Deluxe Mixed, 4 beds)',
    details:
      'Our deluxe mixed four-bed room has air conditioning, keycard door entry, and an ensuite bathroom.',
  },
  '10': {
    name: 'Room 10 (Deluxe Mixed, 6 beds)',
    details:
      'Our deluxe mixed six-bed room has air conditioning, keycard door entry, and an ensuite bathroom.',
  },
  '11': {
    name: 'Room 11 (Superior Mixed, 6 beds)',
    details:
      'Our superior mixed room has air conditioning, keycard door entry, an ensuite bathroom, seaview terrace, and six beds. The terrace in this room is extra-large.',
  },
  '12': {
    name: 'Room 12 (Superior Mixed, 6 beds)',
    details:
      'Our superior mixed room has air conditioning, keycard door entry, an ensuite bathroom, seaview terrace, and six beds. The terrace in this room is extra-large.',
  },
};

/**
 * Returns localised room info for the given ID, falling back to
 * hard‑coded English if no translation is found.
 */
export function getRoomDetails(id: string | number, t: TFunction): RoomInfo {
  const key = String(id);
  const fallback = ROOM_DETAILS_MAP[key] ?? { name: key, details: '' };

  const nameKey = `rooms.${key}.name`;
  const detailsKey = `rooms.${key}.details`;

  // First attempt to resolve the translations (no namespace override)
  const name = t(nameKey, { defaultValue: fallback.name });
  const details = t(detailsKey, { defaultValue: fallback.details });

  return { name, details };
}
