import { dispatchPrimeEmail } from '../lib/email-dispatch';
import { FirebaseRest, errorResponse, jsonResponse } from '../lib/firebase-rest';
import { createGuestDeepLink } from '../lib/guest-token';
import { dispatchQueuedArrival48HoursEvent } from '../lib/messaging-dispatcher';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  PRIME_EMAIL_WEBHOOK_URL?: string;
  PRIME_EMAIL_WEBHOOK_TOKEN?: string;
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
    dispatchArrival48Hours: async (payload) => {
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

      const sendResult = await dispatchPrimeEmail(
        {
          to: payload.email,
          subject: `Arrival in 48 hours, ${payload.firstName}`,
          text: [
            `Hi ${payload.firstName},`,
            '',
            `You're arriving on ${payload.checkInDate}.`,
            `Please bring EUR ${(payload.cityTaxDue + payload.depositDue).toFixed(2)} in cash.`,
            '',
            `Open your guest portal: ${deepLink}`,
          ].join('\n'),
        },
        env,
      );

      if (!sendResult.delivered) {
        const configError = new Error('Prime email provider is not configured');
        (configError as { permanent?: boolean }).permanent = true;
        throw configError;
      }
    },
  });

  return jsonResponse(result);
};

