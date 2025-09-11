import { promises as fs } from 'node:fs';

describe('getReturnBagAndLabel cache', () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('reads configuration once and returns only bag and label fields', async () => {
    const cfg = {
      labelService: 'ups',
      inStore: true,
      dropOffProvider: 'happy-returns',
      tracking: true,
      bagType: 'reusable',
      returnCarrier: ['ups'],
      homePickupZipCodes: ['12345'],
      mobileApp: true,
      requireTags: true,
      allowWear: false,
    };

    const spy = jest
      .spyOn(fs, 'readFile')
      .mockResolvedValue(JSON.stringify(cfg) as any);

    const { getReturnBagAndLabel } = await import('../src/returnLogistics');

    const first = await getReturnBagAndLabel();
    const second = await getReturnBagAndLabel();

    expect(first).toEqual({
      bagType: cfg.bagType,
      labelService: cfg.labelService,
      tracking: cfg.tracking,
      returnCarrier: cfg.returnCarrier,
      homePickupZipCodes: cfg.homePickupZipCodes,
    });
    expect(second).toEqual(first);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
