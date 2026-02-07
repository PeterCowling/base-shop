import fs from 'node:fs';
import path from 'node:path';

import { jest } from '@jest/globals';

const prismaMock = {
  shop: { create: jest.fn(async () => ({})) },
  page: { createMany: jest.fn(async () => ({})) }
};

jest.mock('../src/db', () => ({ prisma: prismaMock }));
jest.mock('../src/createShop/themeUtils', () => ({ loadTokens: () => ({}) }));
jest.mock('@acme/i18n/fillLocales', () => ({ fillLocales: (v: any) => v }), { virtual: true });

describe('createShop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates records in the database', async () => {
    const id = 'shop1';
    const { createShop } = await import('../src/createShop');
    await createShop(id, { theme: 'base' }, { deploy: false });
    expect(prismaMock.shop.create).toHaveBeenCalled();
    fs.rmSync(path.join('data', 'shops', id), { recursive: true, force: true });
  });

  it('stores navigation structure', async () => {
    const id = 'shop2';
    const { createShop } = await import('../src/createShop');
    await createShop(id, {
      theme: 'base',
      navItems: [{ label: 'Parent', url: '/parent', children: [{ label: 'Child', url: '/child' }] }]
    }, { deploy: false });
    const nav = prismaMock.shop.create.mock.calls[0][0].data.data.navigation;
    expect(nav).toEqual([
      { label: 'Parent', url: '/parent', children: [{ label: 'Child', url: '/child' }] }
    ]);
    fs.rmSync(path.join('data', 'shops', id), { recursive: true, force: true });
  });

  it('returns pending when deploy is false', async () => {
    const id = 'shop-pending';
    const { createShop } = await import('../src/createShop');
    const result = await createShop(id, { theme: 'base' }, { deploy: false });
    expect(result).toEqual({ status: 'pending' });
    fs.rmSync(path.join('data', 'shops', id), { recursive: true, force: true });
  });

  it('stores sanityBlog configuration when enabled', async () => {
    const id = 'shop-sanity';
    const { createShop } = await import('../src/createShop');
    const sanity = { projectId: 'p', dataset: 'd', token: 't' };
    const result = await createShop(
      id,
      { theme: 'base', sanityBlog: sanity },
      { deploy: false }
    );
    const stored =
      prismaMock.shop.create.mock.calls[0][0].data.data.sanityBlog;
    expect(stored).toEqual(sanity);
    expect(result).toEqual({ status: 'pending' });
    fs.rmSync(path.join('data', 'shops', id), { recursive: true, force: true });
  });

  it('ignores fs write errors', async () => {
    const id = 'shop-error';
    const { createShop } = await import('../src/createShop');
    const spy = jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => { throw new Error('fail'); });
    const result = await createShop(id, { theme: 'base' }, { deploy: false });
    expect(result).toEqual({ status: 'pending' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    fs.rmSync(path.join('data', 'shops', id), { recursive: true, force: true });
  });

  it('propagates deployment errors when scaffold fails', async () => {
    const id = 'shop-fail';
    const adapter = {
      scaffold: () => {
        throw new Error('fail');
      },
      deploy: jest.fn(() => ({ status: 'success' as const })),
      writeDeployInfo: jest.fn(),
    };
    const { createShop } = await import('../src/createShop');
    const result = await createShop(id, { theme: 'base' }, undefined, adapter as any);
    expect(result.status).toBe('error');
    expect(result.error).toBe('fail');
    expect(adapter.deploy).toHaveBeenCalled();
    expect(adapter.writeDeployInfo).toHaveBeenCalledWith(id, result);
    fs.rmSync(path.join('data', 'shops', id), { recursive: true, force: true });
  });

  it('writes a session secret to the env file', async () => {
    const id = 'shop-secret';
    const appDir = path.join('apps', id);
    fs.mkdirSync(appDir, { recursive: true });
    const envPath = path.join(appDir, '.env');
    fs.writeFileSync(envPath, 'SESSION_SECRET=\n');
    const adapter = {
      scaffold: () => {},
      deploy: () => ({ status: 'success' }),
      writeDeployInfo: () => {}
    };
    const { deployShop } = await import('../src/createShop');
    deployShop(id, undefined, adapter as any);
    const env = fs.readFileSync(envPath, 'utf8');
    expect(env).toMatch(/SESSION_SECRET=\w+/);
    fs.rmSync(appDir, { recursive: true, force: true });
  });
});
