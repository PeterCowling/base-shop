import { jest } from '@jest/globals';
import { ReadableStream as NodeReadableStream } from 'node:stream/web';
import {
  Response as NodeResponse,
  Headers as NodeHeaders,
  Request as NodeRequest,
} from 'undici';

Object.assign(globalThis, {
  fetch: jest.fn(),
  Response: NodeResponse,
  Headers: NodeHeaders,
  Request: NodeRequest,
  ReadableStream: (globalThis as any).ReadableStream || NodeReadableStream,
});

const createShop = jest.fn();
const initShop = jest.fn();
const deployShop = jest.fn();
const seedShop = jest.fn();
const getRequiredSteps = jest.fn();

jest.mock('../../../cms/wizard/services/createShop', () => ({
  __esModule: true,
  createShop: (...args: any[]) => createShop(...args),
}));

jest.mock('../../../cms/wizard/services/initShop', () => ({
  __esModule: true,
  initShop: (...args: any[]) => initShop(...args),
}));

jest.mock('../../../cms/wizard/services/deployShop', () => ({
  __esModule: true,
  deployShop: (...args: any[]) => deployShop(...args),
}));

jest.mock('../../../cms/wizard/services/seedShop', () => ({
  __esModule: true,
  seedShop: (...args: any[]) => seedShop(...args),
}));

jest.mock('../../../cms/configurator/steps', () => ({
  __esModule: true,
  getRequiredSteps: (...args: any[]) => getRequiredSteps(...args),
}));

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

function parseSse(text: string) {
  return text
    .trim()
    .split('\n\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line.replace(/^data: /, '')));
}

async function readStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  result += decoder.decode();
  return result;
}

describe('launch-shop route', () => {
  it('returns 400 when required steps are missing', async () => {
    getRequiredSteps.mockReturnValue([{ id: 'a' }]);
    const { POST } = await import('../route');
    const req = {
      json: async () => ({ shopId: '1', state: { completed: {} } }),
      headers: new Headers(),
    } as unknown as Request;
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.missingSteps).toEqual(['a']);
  });

  it('streams done when steps succeed without seeding', async () => {
    getRequiredSteps.mockReturnValue([]);
    createShop.mockResolvedValue({ ok: true });
    initShop.mockResolvedValue({ ok: true });
    deployShop.mockResolvedValue({ ok: true });

    const { POST } = await import('../route');
    const req = {
      json: async () => ({ shopId: '1', state: { completed: {} }, seed: false }),
      headers: new Headers(),
    } as unknown as Request;

    const res = await POST(req);
    const text = await readStream(res.body as ReadableStream<Uint8Array>);
    const messages = parseSse(text);
    expect(messages[messages.length - 1]).toEqual({ done: true });
    expect(seedShop).not.toHaveBeenCalled();
  });

  it('reports failure and stops when a step fails', async () => {
    getRequiredSteps.mockReturnValue([]);
    createShop.mockResolvedValue({ ok: false, error: 'nope' });

    const { POST } = await import('../route');
    const req = {
      json: async () => ({ shopId: '1', state: { completed: {} } }),
      headers: new Headers(),
    } as unknown as Request;

    const res = await POST(req);
    const text = await readStream(res.body as ReadableStream<Uint8Array>);
    const messages = parseSse(text);
    expect(messages).toEqual([
      { step: 'create', status: 'pending' },
      { step: 'create', status: 'failure', error: 'nope' },
    ]);
    expect(initShop).not.toHaveBeenCalled();
    expect(deployShop).not.toHaveBeenCalled();
    expect(seedShop).not.toHaveBeenCalled();
  });

  it('executes seed step when seeding enabled', async () => {
    getRequiredSteps.mockReturnValue([]);
    createShop.mockResolvedValue({ ok: true });
    initShop.mockResolvedValue({ ok: true });
    deployShop.mockResolvedValue({ ok: true });
    seedShop.mockResolvedValue({ ok: true });

    const { POST } = await import('../route');
    const req = {
      json: async () => ({ shopId: '1', state: { completed: {} }, seed: true }),
      headers: new Headers(),
    } as unknown as Request;

    const res = await POST(req);
    const text = await readStream(res.body as ReadableStream<Uint8Array>);
    const messages = parseSse(text);
    expect(messages).toEqual([
      { step: 'create', status: 'pending' },
      { step: 'create', status: 'success' },
      { step: 'init', status: 'pending' },
      { step: 'init', status: 'success' },
      { step: 'deploy', status: 'pending' },
      { step: 'deploy', status: 'success' },
      { step: 'seed', status: 'pending' },
      { step: 'seed', status: 'success' },
      { done: true },
    ]);
    expect(seedShop).toHaveBeenCalledTimes(1);
  });
});

