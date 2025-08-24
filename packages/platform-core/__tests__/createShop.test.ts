import { jest } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';

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
    const { createShop } = await import('../src/createShop');
    await createShop('shop1', { theme: 'base' }, { deploy: false });
    expect(prismaMock.shop.create).toHaveBeenCalled();
  });

  it('stores navigation structure', async () => {
    const { createShop } = await import('../src/createShop');
    await createShop('shop2', {
      theme: 'base',
      navItems: [{ label: 'Parent', url: '/parent', children: [{ label: 'Child', url: '/child' }] }]
    }, { deploy: false });
    const nav = prismaMock.shop.create.mock.calls[0][0].data.data.navigation;
    expect(nav).toEqual([
      { label: 'Parent', url: '/parent', children: [{ label: 'Child', url: '/child' }] }
    ]);
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
