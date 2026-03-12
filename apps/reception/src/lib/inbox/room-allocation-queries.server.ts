import "server-only";

import { firebaseBookingSchema } from "../../schemas/bookingsSchema";

import { generateEmailHtml } from "./draft-core/email-template";
import { fetchFirebaseJson } from "./firebase-rtdb.server";

const ROOM_ALLOCATION_TEMPLATE_SUBJECT = "Booking Room Allocation Clarification";

const SAME_ROOM_PHRASES = [
  "same room",
  "same dorm",
  "same bedroom",
  "put us together",
  "booked together",
  "split up",
];

type RoomAllocationDraftInput = {
  bookingRef?: string;
  subject?: string;
  body: string;
  recipientName?: string;
};

type RoomAllocationGroup = {
  roomNumbers: string[];
  count: number;
};

type RoomAllocationSnapshot = {
  guestCount: number;
  roomGroups: RoomAllocationGroup[];
  allGuestsSameRoom: boolean;
};

export type RoomAllocationQueryDraftResult = {
  plainText: string;
  html: string;
  templateUsed: {
    subject: string;
    category: "booking-issues";
    confidence: number;
    selection: "auto";
  };
};

function uniqueSortedRooms(roomNumbers: Array<string | number> | undefined): string[] {
  return Array.from(new Set((roomNumbers ?? []).map(String).map((value) => value.trim()).filter(Boolean))).sort();
}

function formatGuestCount(count: number): string {
  return `${count} ${count === 1 ? "guest" : "guests"}`;
}

function formatRoomReference(roomNumbers: string[]): string {
  if (roomNumbers.length === 0) {
    return "no room assignment is currently shown";
  }

  if (roomNumbers.length === 1) {
    return `room ${roomNumbers[0]}`;
  }

  return `rooms ${roomNumbers.join(", ")}`;
}

function isLikelySameRoomQuery(input: RoomAllocationDraftInput): boolean {
  const bookingRef = input.bookingRef?.trim();
  if (!bookingRef) {
    return false;
  }

  const haystack = `${input.subject ?? ""}\n${input.body}`.toLowerCase();
  return (
    SAME_ROOM_PHRASES.some((phrase) => haystack.includes(phrase))
    || (haystack.includes("together") && (haystack.includes("room") || haystack.includes("dorm")))
  );
}

async function readRoomAllocationSnapshot(bookingRef: string): Promise<RoomAllocationSnapshot | null> {
  const raw = await fetchFirebaseJson(`/bookings/${bookingRef}`);
  const parsed = firebaseBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }

  const occupants = Object.entries(parsed.data)
    .filter(([occupantId]) => !occupantId.startsWith("__"))
    .map(([, occupant]) => ({
      roomNumbers:
        "roomNumbers" in occupant && Array.isArray(occupant.roomNumbers)
          ? uniqueSortedRooms(occupant.roomNumbers)
          : [],
    }));

  if (occupants.length === 0) {
    return null;
  }

  const groups = new Map<string, RoomAllocationGroup>();
  for (const occupant of occupants) {
    const key = occupant.roomNumbers.join("|");
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    groups.set(key, {
      roomNumbers: occupant.roomNumbers,
      count: 1,
    });
  }

  const roomGroups = Array.from(groups.values()).sort((left, right) => {
    if (left.roomNumbers.length === 0 && right.roomNumbers.length > 0) {
      return 1;
    }
    if (right.roomNumbers.length === 0 && left.roomNumbers.length > 0) {
      return -1;
    }
    return formatRoomReference(left.roomNumbers).localeCompare(formatRoomReference(right.roomNumbers));
  });

  return {
    guestCount: occupants.length,
    roomGroups,
    allGuestsSameRoom:
      occupants.length > 1 && roomGroups.length === 1 && roomGroups[0]?.roomNumbers.length > 0,
  };
}

function buildRoomAllocationEmailBody(
  recipientName: string | undefined,
  bookingRef: string,
  snapshot: RoomAllocationSnapshot,
): string {
  const greeting = recipientName ? `Dear ${recipientName},` : "Dear Guest,";
  const sections: string[] = [
    greeting,
    "",
    "Thank you for your message.",
    "",
    "I checked your booking in our system.",
    "",
    `Your booking currently shows ${formatGuestCount(snapshot.guestCount)} on this reservation.`,
    "",
  ];

  if (snapshot.allGuestsSameRoom) {
    sections.push(
      `Yes, the current booking data shows that all guests are booked together in ${formatRoomReference(snapshot.roomGroups[0]?.roomNumbers ?? [])}.`,
      "",
    );
  } else if (snapshot.guestCount <= 1) {
    sections.push(
      "At the moment, the booking does not show more than one guest on this reservation, so it does not show multiple guests together in the same room.",
      `The room currently shown is ${formatRoomReference(snapshot.roomGroups[0]?.roomNumbers ?? [])}.`,
      "",
    );
  } else {
    sections.push(
      "The current room allocation shown in our system is:",
      "",
      ...snapshot.roomGroups.map((group) => `- ${formatGuestCount(group.count)}: ${formatRoomReference(group.roomNumbers)}`),
      "",
      "So at the moment, the booking does not show all guests in the same room.",
      "",
    );
  }

  sections.push(`Your booking reference is ${bookingRef}.`);

  return sections.join("\n");
}

export async function buildRoomAllocationQueryDraft(
  input: RoomAllocationDraftInput,
): Promise<RoomAllocationQueryDraftResult | null> {
  const bookingRef = input.bookingRef?.trim();
  if (!bookingRef || !isLikelySameRoomQuery(input)) {
    return null;
  }

  const snapshot = await readRoomAllocationSnapshot(bookingRef).catch(() => null);
  if (!snapshot) {
    return null;
  }

  const plainText = buildRoomAllocationEmailBody(
    input.recipientName,
    bookingRef,
    snapshot,
  );
  const html = generateEmailHtml({
    recipientName: input.recipientName,
    bodyText: plainText,
    subject: input.subject,
  });

  return {
    plainText,
    html,
    templateUsed: {
      subject: ROOM_ALLOCATION_TEMPLATE_SUBJECT,
      category: "booking-issues",
      confidence: 100,
      selection: "auto",
    },
  };
}
