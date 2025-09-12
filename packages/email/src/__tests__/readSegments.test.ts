import { setupSegmentTest } from './segmentTestHelpers';

afterAll(() => { jest.resetModules(); jest.clearAllMocks(); });

describe('readSegments', () => {
  it('returns empty array when JSON is an object', async () => {
    const { mockReadFile, validateShopName } = setupSegmentTest();
    mockReadFile.mockResolvedValue(JSON.stringify({ foo: 1 }));
    const { readSegments } = await import('../segments');
    await expect(readSegments('shop1')).resolves.toEqual([]);
    expect(validateShopName).toHaveBeenCalledWith('shop1');
  });

  it('returns parsed array and validates shop name', async () => {
    const { mockReadFile, validateShopName } = setupSegmentTest();
    mockReadFile.mockResolvedValue(
      JSON.stringify([{ id: 's1', filters: [] }])
    );
    const { readSegments } = await import('../segments');
    const result = await readSegments('shop1');
    expect(result).toEqual([{ id: 's1', filters: [] }]);
    expect(validateShopName).toHaveBeenCalledWith('shop1');
  });

  it('returns empty array on invalid JSON', async () => {
    const { mockReadFile } = setupSegmentTest();
    mockReadFile.mockResolvedValue('{not json}');
    const { readSegments } = await import('../segments');
    await expect(readSegments('shop1')).resolves.toEqual([]);
  });

  it('returns empty array when file is missing', async () => {
    const { mockReadFile } = setupSegmentTest();
    const err = Object.assign(new Error('missing'), { code: 'ENOENT' });
    mockReadFile.mockRejectedValue(err);
    const { readSegments } = await import('../segments');
    await expect(readSegments('shop1')).resolves.toEqual([]);
  });

  it('returns empty array when readFile fails', async () => {
    const { mockReadFile } = setupSegmentTest();
    mockReadFile.mockRejectedValue(new Error('fail'));
    const { readSegments } = await import('../segments');
    await expect(readSegments('shop1')).resolves.toEqual([]);
  });
});
