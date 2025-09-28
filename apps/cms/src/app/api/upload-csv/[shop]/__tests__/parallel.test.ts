/**
 * @jest-environment node
 */
import request from 'supertest';
import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { server } from '~test/msw/server';
function setSession(session: any) {
  const { __setMockSession } = require('next-auth') as { __setMockSession: (s: any) => void };
  __setMockSession(session);
}
jest.mock('@cms/auth/options', () => ({ authOptions: {} }));
jest.mock('file-type/core', () => ({
  fileTypeFromBuffer: jest.fn().mockResolvedValue(undefined),
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

describe('upload-csv parallel', () => {
  let dataRoot: string;
  let handler: ReturnType<typeof createHandler>;

  beforeEach(() => {
    dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'data-'));
    process.env.DATA_ROOT = dataRoot;
    setSession({ user: { role: 'admin' } });
    handler = createHandler();
  });

  afterEach(() => {
    fs.rmSync(dataRoot, { recursive: true, force: true });
    delete process.env.DATA_ROOT;
    jest.resetAllMocks();
  });

  it('persists only one file per shop and reports throughput', async () => {
    const max = 5 * 1024 * 1024;
    const size = max - 1024;
    const header = 'sku\n';
    const makeFile = (ch: string) =>
      Buffer.concat([Buffer.from(header), Buffer.alloc(size - header.length, ch)]);
    const f1 = makeFile('1');
    const f2 = makeFile('2');

    const start = Date.now();
    const [r1, r2] = await Promise.all([
      request(handler)
        .post('/upload-csv/shop1')
        .attach('file', f1, { filename: 'f1.csv', contentType: 'text/csv' }),
      request(handler)
        .post('/upload-csv/shop1')
        .attach('file', f2, { filename: 'f2.csv', contentType: 'text/csv' }),
    ]);
    const duration = Date.now() - start;
    const throughput = (2 * size) / (duration / 1000) / (1024 * 1024);
    console.log(`Parallel upload throughput: ${throughput.toFixed(2)} MB/s`);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);

    const filePath = path.join(dataRoot, 'shop1', 'products.csv');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-2651: test reads from deterministic temp path within sandbox
    const final = fs.readFileSync(filePath);
    expect(final.length).toBe(size);
    expect(final.equals(f1) || final.equals(f2)).toBe(true);
  });

  it('cleans up failed oversized uploads', async () => {
    const max = 5 * 1024 * 1024;
    const big = Buffer.concat([
      Buffer.from('sku\n'),
      Buffer.alloc(max + 1 - 'sku\n'.length, 'x'),
    ]);
    const res = await request(handler)
      .post('/upload-csv/shop2')
      .attach('file', big, { filename: 'big.csv', contentType: 'text/csv' });
    expect(res.status).toBe(413);
    await new Promise((r) => setTimeout(r, 100));
    const failedPath = path.join(dataRoot, 'shop2', 'products.csv');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-2651 test-only: sandboxed temp path under os.tmpdir(); ttl=2026-01-01
    const notExists = !fs.existsSync(failedPath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-2651 test-only: sandboxed temp path under os.tmpdir(); ttl=2026-01-01
    const sizeZero = notExists ? true : fs.statSync(failedPath).size === 0;
    const cleaned = notExists || sizeZero;
    expect(cleaned).toBe(true);
  });
});
