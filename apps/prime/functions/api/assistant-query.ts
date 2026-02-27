/**
 * CF Pages Function: /api/assistant-query
 *
 * LLM fallback for the Prime digital assistant:
 * - validates guest session token
 * - applies per-guest rate limiting (5 requests/minute)
 * - reads guest booking context from Firebase for grounding
 * - calls OpenAI gpt-4o-mini and returns a structured JSON response
 * - strips non-allowlisted links before returning
 * - returns a safe fallback on any OpenAI error
 */

import { FirebaseRest, errorResponse, jsonResponse } from '../lib/firebase-rest';
import { validateGuestSessionToken } from '../lib/guest-session';
import { enforceKvRateLimit } from '../lib/kv-rate-limit';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  RATE_LIMIT?: KVNamespace;
  OPENAI_API_KEY: string;
}

interface AssistantQueryBody {
  token?: string;
  query?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface OccupantRecord {
  firstName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  drinksAllowed?: boolean;
}

interface LlmResponseShape {
  answer?: string;
  links?: Array<{ label?: string; href?: string }>;
}

const SAFETY_FALLBACK_ANSWER =
  'I am unable to answer right now. Please ask reception for help.';

const SAFETY_FALLBACK_LINK = { label: 'Reception support', href: '/booking-details' };

const ALLOWLISTED_HOSTS = new Set([
  'hostel-positano.com',
  'www.hostel-positano.com',
  'www.hostelbrikette.com',
  'hostelbrikette.com',
]);

function isAllowlistedUrl(url: string): boolean {
  if (url.startsWith('/')) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return ALLOWLISTED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function stripLinks(
  raw: unknown,
): Array<{ label: string; href: string }> {
  if (!Array.isArray(raw)) {
    return [];
  }
  const result: Array<{ label: string; href: string }> = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === 'object' &&
      typeof item.label === 'string' &&
      typeof item.href === 'string' &&
      isAllowlistedUrl(item.href)
    ) {
      result.push({ label: item.label, href: item.href });
    }
  }
  return result;
}

function buildSystemPrompt(occupant: OccupantRecord | null): string {
  const guestName = occupant?.firstName ?? 'Guest';
  const checkInLine = occupant?.checkInDate ? ` Check-in date: ${occupant.checkInDate}.` : '';
  const checkOutLine = occupant?.checkOutDate ? ` Check-out date: ${occupant.checkOutDate}.` : '';
  const entitlementLine =
    occupant?.drinksAllowed !== undefined
      ? ` The guest's meal/drink entitlement status: ${occupant.drinksAllowed ? 'included in booking' : 'not included'}.`
      : '';

  return (
    `You are a helpful digital assistant for Brikette hostel guests in Positano, Italy. ` +
    `Answer questions about the guest's booking, hostel services, local area, transport, food, activities, and the Positano area. ` +
    `Politely redirect questions that are clearly outside this scope. Do not invent information you are unsure of. ` +
    `The guest's name is ${guestName}.${checkInLine}${checkOutLine}${entitlementLine} ` +
    `When providing links, only use paths from this allowed list: /booking-details, /activities, /positano-guide, ` +
    `/complimentary-breakfast, /complimentary-evening-drink, /bag-storage, /find-my-stay. ` +
    `For external links, only use https://www.hostelbrikette.com or https://hostel-positano.com. ` +
    `Respond with valid JSON in this exact format: {"answer": "your answer here", "links": [{"label": "link text", "href": "/path-or-url"}]}. ` +
    `The links array may be empty. Keep the answer concise and helpful.`
  );
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: AssistantQueryBody;
  try {
    body = (await request.json()) as AssistantQueryBody;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const query = (body.query ?? '').trim();
  if (!query) {
    return errorResponse('query is required', 400);
  }

  const history = Array.isArray(body.history) ? body.history : [];

  try {
    const authResult = await validateGuestSessionToken(body.token ?? null, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    const guestUuid = authResult.session.guestUuid;
    if (!guestUuid) {
      return errorResponse('guestUuid missing for session', 422);
    }

    const rateLimitResponse = await enforceKvRateLimit({
      key: `llm-assistant:${guestUuid}`,
      maxRequests: 5,
      windowSeconds: 60,
      errorMessage: 'Too many questions. Please wait a moment before asking again.',
      kv: env.RATE_LIMIT,
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const firebase = new FirebaseRest(env);
    const occupant = await firebase.get<OccupantRecord>(
      `bookings/${authResult.session.bookingId}/${guestUuid}`,
    );

    const startMs = Date.now();

    const systemMessage = { role: 'system' as const, content: buildSystemPrompt(occupant) };
    const historyMessages = history
      .slice(-10) // cap at last 10 messages (5 exchanges)
      .map((h) => ({ role: h.role, content: h.content }));
    const userMessage = { role: 'user' as const, content: query };
    const allMessages = [systemMessage, ...historyMessages, userMessage];

    try {
      const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: allMessages,
          response_format: { type: 'json_object' },
          max_tokens: 500,
        }),
      });

      if (!openAiResponse.ok) {
        throw new Error(`OpenAI API error: ${openAiResponse.status}`);
      }

      const openAiData = (await openAiResponse.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const rawContent = openAiData?.choices?.[0]?.message?.content;
      if (typeof rawContent !== 'string') {
        throw new Error('Unexpected OpenAI response shape');
      }

      const parsed = JSON.parse(rawContent) as LlmResponseShape;

      if (typeof parsed.answer !== 'string' || !parsed.answer.trim()) {
        throw new Error('OpenAI response missing answer field');
      }

      const filteredLinks = stripLinks(parsed.links);

      return jsonResponse({
        answer: parsed.answer.trim(),
        answerType: 'llm',
        links: filteredLinks,
        category: 'general',
        durationMs: Date.now() - startMs,
      });
    } catch {
      return jsonResponse({
        answer: SAFETY_FALLBACK_ANSWER,
        answerType: 'llm-safety-fallback',
        links: [SAFETY_FALLBACK_LINK],
        category: 'general',
        durationMs: Date.now() - startMs,
      });
    }
  } catch (error) {
    console.error('assistant-query: unexpected error', error);
    return errorResponse('Internal server error', 500);
  }
};
