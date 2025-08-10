import sitemap from '../src/app/sitemap';

jest.mock('@platform-core/src/repositories/settings.server', () => ({
  getShopSettings: jest.fn().mockResolvedValue({ languages: ['en', 'de'] }),
}));

jest.mock('@platform-core/src/repositories/products.server', () => ({
  readRepo: jest
    .fn()
    .mockResolvedValue([
      { id: '1', slug: 'p1' },
      { id: '2', slug: 'p2' },
    ]),
}));

describe('sitemap', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SHOP_ID = 'shop';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
  });

  it('generates URLs with hreflang alternates', async () => {
    const map = await sitemap();
    expect(map).toEqual([
      {
        url: 'https://example.com/en',
        alternates: {
          languages: {
            en: 'https://example.com/en',
            de: 'https://example.com/de',
          },
        },
      },
      {
        url: 'https://example.com/en/product/p1',
        alternates: {
          languages: {
            en: 'https://example.com/en/product/p1',
            de: 'https://example.com/de/product/p1',
          },
        },
      },
      {
        url: 'https://example.com/en/product/p2',
        alternates: {
          languages: {
            en: 'https://example.com/en/product/p2',
            de: 'https://example.com/de/product/p2',
          },
        },
      },
    ]);
  });
});
