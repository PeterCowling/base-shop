/**
 * @jest-environment node
 */

import { onRequestPost } from '../assistant-query';
import { FirebaseRest } from '../../lib/firebase-rest';
import { createMockKv, createPagesContext } from '../../__tests__/helpers';

const VALID_SESSION = {
  bookingId: 'BOOK123',
  guestUuid: 'occ_1234567890123',
  createdAt: '2026-02-01T00:00:00.000Z',
  expiresAt: '2099-02-01T00:00:00.000Z',
};

const VALID_OCCUPANT = {
  firstName: 'Jane',
  checkInDate: '2026-02-10',
  checkOutDate: '2026-02-14',
  drinksAllowed: true,
};

function createAssistantEnv(overrides: Record<string, unknown> = {}) {
  return {
    CF_FIREBASE_DATABASE_URL: 'https://example.firebaseio.com',
    CF_FIREBASE_API_KEY: 'test-api-key',
    OPENAI_API_KEY: 'sk-test',
    ...overrides,
  };
}

function makeOpenAiResponse(answer: string, links: Array<{ label: string; href: string }> = []) {
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ answer, links }) } }],
    }),
  } as unknown as Response;
}

describe('/api/assistant-query', () => {
  const getSpy = jest.spyOn(FirebaseRest.prototype, 'get');
  let fetchSpy: ReturnType<typeof jest.spyOn<typeof globalThis, 'fetch'>>;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchSpy = jest.spyOn(global, 'fetch');
    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') return VALID_SESSION;
      if (path === 'bookings/BOOK123/occ_1234567890123') return VALID_OCCUPANT;
      return null;
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  afterAll(() => {
    getSpy.mockRestore();
  });

  it('TC-01: valid token + valid query → 200 with answerType: llm', async () => {
    fetchSpy.mockResolvedValueOnce(
      makeOpenAiResponse('The beach is a 10 minute walk down the steps.'),
    );
    const kv = createMockKv();
    const env = createAssistantEnv({ RATE_LIMIT: kv });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/assistant-query',
        method: 'POST',
        body: { token: 'token-1', query: 'How do I get to the beach?' },
        env: env as any,
      }),
    );

    const payload = await response.json() as {
      answer: string;
      answerType: string;
      links: unknown[];
      category: string;
      durationMs: number;
    };
    expect(response.status).toBe(200);
    expect(payload.answerType).toBe('llm');
    expect(typeof payload.answer).toBe('string');
    expect(payload.answer.length).toBeGreaterThan(0);
    expect(payload.category).toBe('general');
    expect(Array.isArray(payload.links)).toBe(true);
  });

  it('TC-02: missing token → 400', async () => {
    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/assistant-query',
        method: 'POST',
        body: { query: 'What time is breakfast?' },
        env: createAssistantEnv() as any,
      }),
    );

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('TC-03: rate limit exceeded → 429', async () => {
    const kv = createMockKv({ 'llm-assistant:occ_1234567890123': '5' });
    const env = createAssistantEnv({ RATE_LIMIT: kv });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/assistant-query',
        method: 'POST',
        body: { token: 'token-1', query: 'Where is the nearest restaurant?' },
        env: env as any,
      }),
    );

    expect(response.status).toBe(429);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('TC-04: OpenAI fetch throws → 200 with answerType: llm-safety-fallback', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));
    const kv = createMockKv();
    const env = createAssistantEnv({ RATE_LIMIT: kv });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/assistant-query',
        method: 'POST',
        body: { token: 'token-1', query: 'Can I get a late checkout?' },
        env: env as any,
      }),
    );

    const payload = await response.json() as { answerType: string; answer: string };
    expect(response.status).toBe(200);
    expect(payload.answerType).toBe('llm-safety-fallback');
    expect(typeof payload.answer).toBe('string');
  });

  it('TC-05: OpenAI returns non-allowlisted link → link stripped from response', async () => {
    fetchSpy.mockResolvedValueOnce(
      makeOpenAiResponse('Visit our website.', [
        { label: 'Allowed', href: '/booking-details' },
        { label: 'Unsafe', href: 'https://example.com/malicious' },
      ]),
    );
    const kv = createMockKv();
    const env = createAssistantEnv({ RATE_LIMIT: kv });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/assistant-query',
        method: 'POST',
        body: { token: 'token-1', query: 'Where can I find more info?' },
        env: env as any,
      }),
    );

    const payload = await response.json() as { links: Array<{ label: string; href: string }> };
    expect(response.status).toBe(200);
    expect(payload.links).toHaveLength(1);
    expect(payload.links[0]?.href).toBe('/booking-details');
  });

  it('TC-06: durationMs is a non-negative number in response', async () => {
    fetchSpy.mockResolvedValueOnce(
      makeOpenAiResponse('The hostel is a short walk from the bus stop.'),
    );
    const kv = createMockKv();
    const env = createAssistantEnv({ RATE_LIMIT: kv });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/assistant-query',
        method: 'POST',
        body: { token: 'token-1', query: 'How do I get here from Naples?' },
        env: env as any,
      }),
    );

    const payload = await response.json() as { durationMs: number };
    expect(response.status).toBe(200);
    expect(typeof payload.durationMs).toBe('number');
    expect(payload.durationMs).toBeGreaterThanOrEqual(0);
  });
});
