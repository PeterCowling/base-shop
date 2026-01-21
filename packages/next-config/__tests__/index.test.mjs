import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

process.env.CMS_SPACE_URL = 'https://example.com';
process.env.CMS_ACCESS_TOKEN = 'test-token';
process.env.SANITY_API_VERSION = '2023-05-31';

const moduleUrl = new URL('../index.mjs', import.meta.url);
const freshImport = () => import(`${moduleUrl.href}?t=${Date.now()}&r=${Math.random()}`);

test('next-config', async (t) => {
  await t.test('resolves first shop directory', async () => {
    const original = fs.readdirSync;
    fs.readdirSync = () => [
      { name: 'shop-a', isDirectory: () => true },
      { name: 'shop-b', isDirectory: () => true },
    ];
    const prev = process.env.NEXT_PUBLIC_DEFAULT_SHOP;
    delete process.env.NEXT_PUBLIC_DEFAULT_SHOP;
    const { baseConfig } = await freshImport();
    assert.equal(baseConfig.env.NEXT_PUBLIC_DEFAULT_SHOP, 'shop-a');
    fs.readdirSync = original;
    if (prev !== undefined) process.env.NEXT_PUBLIC_DEFAULT_SHOP = prev;
  });

  await t.test('falls back to "abc" when directory missing', async () => {
    const original = fs.readdirSync;
    fs.readdirSync = () => {
      throw new Error('missing');
    };
    const prev = process.env.NEXT_PUBLIC_DEFAULT_SHOP;
    delete process.env.NEXT_PUBLIC_DEFAULT_SHOP;
    const { baseConfig } = await freshImport();
    assert.equal(baseConfig.env.NEXT_PUBLIC_DEFAULT_SHOP, 'abc');
    fs.readdirSync = original;
    if (prev !== undefined) process.env.NEXT_PUBLIC_DEFAULT_SHOP = prev;
  });

  await t.test('transpilePackages includes required packages', async () => {
    const { baseConfig } = await freshImport();
    assert.deepEqual(baseConfig.transpilePackages, [
      '@acme/config',
      '@acme/ui',
      '@acme/platform-core',
      '@acme/i18n',
      '@acme/template-app',
      '@acme/lib',
    ]);
  });

  await t.test('sets output to export when OUTPUT_EXPORT is set', async () => {
    const prev = process.env.OUTPUT_EXPORT;
    process.env.OUTPUT_EXPORT = '1';
    const { baseConfig } = await freshImport();
    assert.equal(baseConfig.output, 'export');
    if (prev === undefined) delete process.env.OUTPUT_EXPORT;
    else process.env.OUTPUT_EXPORT = prev;
  });

  await t.test('withShopCode uses default when SHOP_CODE absent', async () => {
    const { withShopCode, baseConfig } = await freshImport();
    delete process.env.SHOP_CODE;
    const config = withShopCode();
    assert.equal(
      config.env.NEXT_PUBLIC_DEFAULT_SHOP,
      baseConfig.env.NEXT_PUBLIC_DEFAULT_SHOP,
    );
    assert.ok(!('SHOP_CODE' in config.env));
  });

  await t.test('withShopCode parameter overrides environment', async () => {
    const { withShopCode } = await freshImport();
    process.env.SHOP_CODE = 'env-shop';
    const config = withShopCode('param-shop');
    assert.equal(config.env.SHOP_CODE, 'param-shop');
    delete process.env.SHOP_CODE;
  });

  await t.test('withShopCode merges provided env values', async () => {
    const { withShopCode, baseConfig } = await freshImport();
    const config = withShopCode('shop-x', { env: { EXTRA: '1' } });
    assert.equal(config.env.SHOP_CODE, 'shop-x');
    assert.equal(config.env.EXTRA, '1');
    assert.equal(
      config.env.NEXT_PUBLIC_DEFAULT_SHOP,
      baseConfig.env.NEXT_PUBLIC_DEFAULT_SHOP,
    );
  });
});
