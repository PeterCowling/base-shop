/**
 * @jest-environment node
 */
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { PassThrough } from 'stream';
import type { IncomingMessage, ServerResponse } from 'http';
import { server } from '~test/msw/server';
import { __setMockSession } from 'next-auth';
jest.mock('@cms/auth/options', () => ({ authOptions: {} }));

const fileTypeFromBuffer = jest.fn();
jest.mock('file-type/core', () => ({ fileTypeFromBuffer }));

const actualFs = jest.requireActual('fs');
const createWriteStream = jest.fn();
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  createWriteStream: (...args: any[]) => createWriteStream(...args),
}));

let POST: typeof import('../route').POST;

beforeAll(async () => {
  ({ POST } = await import('../route'));
  server.close();
});

function collectBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function createHandler() {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '', 'http://test');
    const shop = url.pathname.split('/').pop() ?? '';
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) headers.set(key, value.join(','));
      else if (value !== undefined) headers.set(key, value);
    }
    const body = await collectBody(req);
    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
    });
    const response = await POST(request as any, {
      params: Promise.resolve({ shop }),
    });
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  };
}

describe('import-products route', () => {
  let dataRoot: string;
  let handler: ReturnType<typeof createHandler>;
  const filePath = () => path.join(dataRoot, 'shop1', 'products.csv');

  beforeEach(() => {
    dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'data-'));
    process.env.DATA_ROOT = dataRoot;
    __setMockSession({ user: { role: 'admin' } } as any);
    fileTypeFromBuffer.mockResolvedValue(undefined);
    createWriteStream.mockImplementation(actualFs.createWriteStream);
    handler = createHandler();
  });

  afterEach(() => {
    fs.rmSync(dataRoot, { recursive: true, force: true });
    delete process.env.DATA_ROOT;
    jest.resetAllMocks();
  });

  it('rejects non-CSV product payloads', async () => {
    fileTypeFromBuffer.mockResolvedValue({ mime: 'application/json' });
    const res = await request(handler)
      .post('/import-products/shop1')
      .attach('file', Buffer.from('not,csv'), {
        filename: 'p.json',
        contentType: 'application/json',
      });
    expect(res.status).toBe(415);
    expect(res.body).toEqual({ error: 'Invalid file type' });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- TEST-201 temp path under os.tmpdir()
    expect(fs.existsSync(filePath())).toBe(false);
  });

  it('returns 400 when repository write fails', async () => {
    fileTypeFromBuffer.mockResolvedValue(undefined);
    createWriteStream.mockImplementation(() => {
      const stream = new PassThrough();
      process.nextTick(() => stream.emit('error', new Error('disk full')));
      return stream as any;
    });
    const res = await request(handler)
      .post('/import-products/shop1')
      .attach('file', Buffer.from('sku\n1'), {
        filename: 'p.csv',
        contentType: 'text/csv',
      });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'disk full' });
  });
});
