/**
 * CF Pages Function: /api/assistant-query
 *
 * LLM fallback for the Prime digital assistant:
 * - validates guest session token
 * - applies per-guest rate limiting (5 requests/minute)
 * - reads guest booking context from Firebase for grounding
 * - calls OpenAI gpt-5-mini and returns a structured JSON response
 * - strips non-allowlisted links before returning
 * - returns a safe fallback on any OpenAI error
 */

import { errorResponse, FirebaseRest, jsonResponse } from '../lib/firebase-rest';
import { createFunctionTranslator } from '../lib/function-i18n';
import { validateGuestSessionToken } from '../lib/guest-session';
import { enforceKvRateLimit } from '../lib/kv-rate-limit';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  RATE_LIMIT?: KVNamespace;
  OPENAI_API_KEY: string;
}

interface AssistantQueryBody {
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

function buildSystemPrompt(
  occupant: OccupantRecord | null,
  t: (path: string, vars?: Record<string, string | number | boolean>) => string,
): string {
  const guestName = occupant?.firstName ?? t('assistantQuery.defaultGuestName');
  const checkInLine = occupant?.checkInDate
    ? t('assistantQuery.prompt.checkInLine', { checkInDate: occupant.checkInDate })
    : '';
  const checkOutLine = occupant?.checkOutDate
    ? t('assistantQuery.prompt.checkOutLine', { checkOutDate: occupant.checkOutDate })
    : '';
  const entitlementLine =
    occupant?.drinksAllowed !== undefined
      ? occupant.drinksAllowed
        ? t('assistantQuery.prompt.entitlementIncluded')
        : t('assistantQuery.prompt.entitlementNotIncluded')
      : '';

  return t('assistantQuery.prompt.template', {
    guestName,
    checkInLine,
    checkOutLine,
    entitlementLine,
  });
}

function parseCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key.trim() === name) {
      return rest.join('=').trim() || null;
    }
  }
  return null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { t } = createFunctionTranslator(request, 'AssistantApi');

  let body: AssistantQueryBody;
  try {
    body = (await request.json()) as AssistantQueryBody;
  } catch {
    return errorResponse(t('assistantQuery.errors.invalidJsonBody'), 400);
  }

  const query = (body.query ?? '').trim();
  if (!query) {
    return errorResponse(t('assistantQuery.errors.queryRequired'), 400);
  }

  const history = Array.isArray(body.history) ? body.history : [];

  // Extract prime_session cookie — do not pass null to validateGuestSessionToken
  const cookieToken = parseCookie(request.headers.get('Cookie') ?? '', 'prime_session');
  if (!cookieToken) {
    return errorResponse('Unauthorized', 401); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  try {
    const authResult = await validateGuestSessionToken(cookieToken, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    const guestUuid = authResult.session.guestUuid;
    if (!guestUuid) {
      return errorResponse(t('assistantQuery.errors.guestUuidMissing'), 422);
    }

    const rateLimitResponse = await enforceKvRateLimit({
      key: `llm-assistant:${guestUuid}`,
      maxRequests: 5,
      windowSeconds: 60,
      errorMessage: t('assistantQuery.rateLimitError'),
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

    const systemMessage = { role: 'system' as const, content: buildSystemPrompt(occupant, t) };
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
          model: 'gpt-5-mini',
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
        answer: t('assistantQuery.fallbackAnswer'),
        answerType: 'llm-safety-fallback',
        links: [{
          label: t('assistantQuery.fallbackLinkLabel'),
          href: '/booking-details',
        }],
        category: 'general',
        durationMs: Date.now() - startMs,
        errorCode: 'llm_unavailable',
      }, 503);
    }
  } catch (error) {
    console.error('assistant-query: unexpected error', error);
    return errorResponse(t('assistantQuery.errors.internalServerError'), 500);
  }
};
