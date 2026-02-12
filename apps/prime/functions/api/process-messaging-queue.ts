import { FirebaseRest, errorResponse, jsonResponse } from '../lib/firebase-rest';
import { createGuestDeepLink } from '../lib/guest-token';
import { dispatchQueuedArrival48HoursEvent } from '../lib/messaging-dispatcher';
import { writeOutboundDraft } from '../lib/outbound-draft';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
}

interface ProcessQueueRequestBody {
  eventId?: string;
}

/**
 * Derive the public base URL from the incoming request.
 * In production this is the custom domain; in staging the Pages preview URL.
 */
function deriveBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: ProcessQueueRequestBody;
  try {
    body = await request.json() as ProcessQueueRequestBody;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const eventId = (body.eventId ?? '').trim();
  if (!eventId) {
    return errorResponse('eventId is required', 400);
  }

  const queueStore = new FirebaseRest(env);
  const baseUrl = deriveBaseUrl(request);

  const result = await dispatchQueuedArrival48HoursEvent(eventId, {
    queueStore,
    dispatchArrival48Hours: async (payload, record) => {
      // Look up checkout date from booking for token expiry
      const booking = await queueStore.get<Record<string, { checkOutDate?: string }>>(
        `bookings/${payload.bookingCode}/${payload.uuid}`,
      );
      const checkOutDate = booking?.checkOutDate ?? '';

      // Generate a secure deep link instead of the insecure UUID-based URL
      const deepLink = await createGuestDeepLink(queueStore, {
        bookingId: payload.bookingCode,
        guestUuid: payload.uuid,
        checkOutDate,
        baseUrl,
      });

      const totalCash = (payload.cityTaxDue + payload.depositDue).toFixed(2);
      const guideUrl = 'https://www.hostelbrikette.com/en/how-to-get-here/ferry-dock-to-hostel-brikette-with-luggage';

      const subject = `Arriving soon, ${payload.firstName} — read this before you travel`;
      const bodyText = [
        `Hi ${payload.firstName},`,
        '',
        'Please DO NOT arrive by ferry and walk up to the hostel with luggage!',
        '',
        'Ignore any Google Maps advice that says "15 minute walk" — it will be 30 minutes of carrying your luggage up stairs.',
        '',
        'Your options:',
        '',
        '1. Give your bags to the porters at the ferry dock and have them bring them up. They are reliable — best EUR 15 you could spend.',
        '',
        `2. Take the interno bus from Piazza dei Mulini to Chiesa Nuova (just a few euros, gets you within 100m of the hostel). Full guide: ${guideUrl}`,
        '',
        `Please bring EUR ${totalCash} in cash for city tax and key deposit.`,
        '',
        `Plan your route and confirm your arrival time in your guest portal:`,
        deepLink,
        '',
        'See you soon!',
        '',
        'Hostel Brikette',
      ].join('\n');

      await writeOutboundDraft(queueStore, record.eventId, {
        to: payload.email,
        subject,
        bodyText,
        category: 'pre-arrival',
        guestName: payload.firstName,
        bookingCode: payload.bookingCode,
        eventId: record.eventId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    },
  });

  return jsonResponse(result);
};

